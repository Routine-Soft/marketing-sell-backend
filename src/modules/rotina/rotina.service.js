import mongoose from 'mongoose'
import RotinaDiaModel from './rotina-dia.model.js'
import LeadModel from '../lead/lead.model.js'
import ContatoModel from '../lead/contato.model.js'
import { filtroFollowUp } from '../lead/lead.contato.js'
import ParceiroModel from '../parceiro/parceiro.model.js'
import { rotinaDoNegocio } from '../negocio/negocio.contas.js'
import { diaDe, diaDaSemana, diaUtil, diaValido, fimDoDia, inicioDoDia, somarDias } from '../shared/utils/dia.js'
import AppError from '../../errors/AppError.js'

const FUSO = '-03:00'
const DIAS_DA_CONSTANCIA = 30
const MAXIMO_DE_DIAS = 45
const SEM_CONTAGEM = { leads: 0, primeirosContatos: 0, followUps: 0, parceiros: 0 }
// Captação com sobra (pedido de 2026-11-19): o que passou da meta num dia vale para os dias seguintes.
// Ex.: meta 30, captou 93 na segunda → segunda leva 30, sobram 63 → terça e quarta já ficam feitas (sobram 3).
// Dia com menos que a meta não vira dívida: só gasta a sobra que havia.
// Primeiros contatos além da meta gastam a sobra de leads (captou 40 e mandou 40: não sobra nada), para a sobra
// bater com os leads que ainda esperam a primeira mensagem. A meta de contatos não tem sobra: vale todo dia.
const CONTAGENS_COM_SOBRA = ['leads', 'parceiros']
const GASTA_A_SOBRA = { leads: 'primeirosContatos' }

function segundaDe(dia) {
    return somarDias(dia, -((diaDaSemana(dia) + 6) % 7))
}

function idDaConta(tenantId) {
    return new mongoose.Types.ObjectId(String(tenantId))
}

function valeNoDia(linha, dia) {
    return diaUtil(dia) && (!linha.dias?.length || linha.dias.includes(diaDaSemana(dia)))
}

// Meta da contagem na rotina do negócio (a tarefa que se marca sozinha por ela, ou a linha automática).
function metaDe(linhas, contagem) {
    return linhas.find((linha) => linha.auto === contagem && linha.meta)?.meta
        ?? linhas.find((linha) => linha.contagem === contagem && linha.meta)?.meta
        ?? null
}

// Tarefas numeradas na ordem (1, 2, 3...), como na planilha.
function numerar(linhas) {
    let numero = 0
    return linhas.map((linha) => (linha.tipo === 'tarefa' ? { ...linha, numero: ++numero } : linha))
}

// Contagens de cada dia do período: leads cadastrados, primeiros contatos, follow-ups feitos e parceiros cadastrados.
async function contagensPorDia(tenantId, primeiroDia, ultimoDia) {
    const periodo = { $gte: inicioDoDia(primeiroDia), $lt: fimDoDia(ultimoDia) }
    const porDia = (campo) => ({ $dateToString: { format: '%Y-%m-%d', date: campo, timezone: FUSO } })
    const cadastradosPorDia = (Model) => Model.aggregate([
        { $match: { tenantId: idDaConta(tenantId), createdAt: periodo } },
        { $group: { _id: porDia('$createdAt'), total: { $sum: 1 } } },
    ])
    const [leads, parceiros, contatos] = await Promise.all([
        cadastradosPorDia(LeadModel),
        cadastradosPorDia(ParceiroModel),
        ContatoModel.aggregate([
            { $match: { tenantId: idDaConta(tenantId), em: periodo } },
            { $group: { _id: { dia: porDia('$em'), primeiro: { $eq: ['$numero', 1] } }, total: { $sum: 1 } } },
        ]),
    ])
    const contagens = {}
    const doDia = (dia) => (contagens[dia] ??= { ...SEM_CONTAGEM })
    leads.forEach((linha) => { doDia(linha._id).leads = linha.total })
    parceiros.forEach((linha) => { doDia(linha._id).parceiros = linha.total })
    contatos.forEach((linha) => { doDia(linha._id.dia)[linha._id.primeiro ? 'primeirosContatos' : 'followUps'] = linha.total })
    return contagens
}

function followUpsVencidos(tenantId) {
    return LeadModel.countDocuments({ tenantId, ...filtroFollowUp('vencido', fimDoDia(diaDe())) })
}

// Sobra que chega em cada dia (vinda dos anteriores), por contagem com sobra. Conta a partir de `inicio`
// (primeiro dia de uso da rotina); dia em que a tarefa não vale (fim de semana...) só acumula o que foi captado.
function sobrasPorDia(linhas, contagens, inicio, ultimoDia) {
    const tarefaDe = (contagem) => linhas.find((linha) => linha.auto === contagem && linha.meta)
    const regras = CONTAGENS_COM_SOBRA
        .map((contagem) => ({ contagem, linha: tarefaDe(contagem), gasta: GASTA_A_SOBRA[contagem], linhaQueGasta: tarefaDe(GASTA_A_SOBRA[contagem]) }))
        .filter((regra) => regra.linha)
    const sobra = Object.fromEntries(regras.map((regra) => [regra.contagem, 0]))
    const porDia = {}
    for (let dia = inicio; dia <= ultimoDia; dia = somarDias(dia, 1)) {
        porDia[dia] = { ...sobra }
        for (const { contagem, linha, gasta, linhaQueGasta } of regras) {
            const disponivel = sobra[contagem] + (contagens[dia]?.[contagem] ?? 0)
            const usado = valeNoDia(linha, dia) ? linha.meta : 0
            // Contatos além da meta do dia (no dia em que a tarefa de contato não vale, todos contam como extra).
            const extras = linhaQueGasta
                ? Math.max(0, (contagens[dia]?.[gasta] ?? 0) - (valeNoDia(linhaQueGasta, dia) ? linhaQueGasta.meta : 0))
                : 0
            sobra[contagem] = Math.max(0, disponivel - usado - extras)
        }
    }
    return porDia
}

// Um dia da grade: o que está feito (marcado pela pessoa ou pelo sistema), as contagens, a sobra dos dias
// anteriores e o % das tarefas. followUpsPendentes só existe para hoje: nos outros dias, vale o que ficou gravado.
function montarDia(linhas, dia, contagens = SEM_CONTAGEM, marcadas = [], followUpsPendentes = null, sobras = {}) {
    const feita = (linha) => {
        if (linha.auto === 'followUp') return followUpsPendentes === null ? marcadas.includes(linha.id) : followUpsPendentes === 0
        if (linha.auto) return contagens[linha.auto] + (sobras[linha.auto] ?? 0) >= linha.meta
        return marcadas.includes(linha.id)
    }
    const doDia = linhas.filter((linha) => linha.tipo !== 'automatico' && valeNoDia(linha, dia))
    const feitas = doDia.filter(feita).map((linha) => linha.id)
    const tarefas = doDia.filter((linha) => linha.tipo === 'tarefa')
    const concluidas = tarefas.filter((linha) => feitas.includes(linha.id)).length
    return {
        dia,
        util: diaUtil(dia),
        feitas,
        contagens,
        sobras,
        followUpsPendentes,
        percentual: tarefas.length ? Math.round((concluidas / tarefas.length) * 100) : 0,
    }
}

async function diasMontados(tenantId, linhas, primeiroDia, ultimoDia) {
    const hoje = diaDe()
    const primeiroRegistro = await RotinaDiaModel.findOne({ tenantId }).sort({ dia: 1 }).lean()
    // A sobra vem desde o primeiro dia de uso: as contagens começam lá quando ele é anterior ao período.
    const inicio = primeiroRegistro?.dia && primeiroRegistro.dia < primeiroDia ? primeiroRegistro.dia : primeiroDia
    const [contagens, registros, pendentes] = await Promise.all([
        contagensPorDia(tenantId, inicio, ultimoDia),
        RotinaDiaModel.find({ tenantId, dia: { $gte: primeiroDia, $lte: ultimoDia } }).lean(),
        hoje >= primeiroDia && hoje <= ultimoDia ? followUpsVencidos(tenantId) : null,
    ])
    const sobras = sobrasPorDia(linhas, contagens, inicio, ultimoDia)
    const feitasPorDia = Object.fromEntries(registros.map((registro) => [registro.dia, registro.feitas]))
    const dias = []
    for (let dia = primeiroDia; dia <= ultimoDia; dia = somarDias(dia, 1)) {
        dias.push(montarDia(linhas, dia, contagens[dia], feitasPorDia[dia], dia === hoje ? pendentes : null, sobras[dia]))
    }
    return dias
}

function diaDTO(texto) {
    const dia = texto || diaDe()
    if (!diaValido(dia)) throw new AppError('Data inválida', 400)
    return dia
}

export const RotinaService = {
    // A grade da tela: as linhas e os dias úteis do período (padrão: a semana atual e a seguinte).
    async grade(tenantId, query = {}) {
        const hoje = diaDe()
        const de = query.de ? diaDTO(query.de) : segundaDe(hoje)
        const ate = query.ate ? diaDTO(query.ate) : somarDias(de, 11)
        if (ate < de || somarDias(de, MAXIMO_DE_DIAS) < ate) throw new AppError('Período inválido', 400)
        if (hoje >= de && hoje <= ate) await this.sincronizarHoje(tenantId)
        const { blocos, linhas } = await rotinaDoNegocio(tenantId)
        const [dias, primeiroRegistro] = await Promise.all([
            diasMontados(tenantId, linhas, de, ate),
            RotinaDiaModel.findOne({ tenantId }).sort({ dia: 1 }).lean(),
        ])
        // inicio = primeiro dia em que a conta usou a rotina: antes dele a tela não pinta o dia como "não feito".
        return { hoje, de, ate, inicio: primeiroRegistro?.dia ?? hoje, blocos, linhas: numerar(linhas), dias: dias.filter((dia) => dia.util) }
    },

    async marcar(tenantId, texto, body) {
        const dia = diaDTO(texto)
        const { linhas } = await rotinaDoNegocio(tenantId)
        const linha = linhas.find((item) => item.id === body?.linhaId && valeNoDia(item, dia))
        if (!linha) throw new AppError('Tarefa não encontrada neste dia', 404)
        if (linha.auto || linha.tipo === 'automatico') throw new AppError('Esta tarefa é marcada sozinha pelo sistema', 400)
        await RotinaDiaModel.updateOne(
            { tenantId, dia },
            body.feita ? { $addToSet: { feitas: linha.id } } : { $pull: { feitas: linha.id } },
            { upsert: true },
        )
        const [montado] = await diasMontados(tenantId, linhas, dia, dia)
        return montado
    },

    // Grava no dia de hoje se o follow-up está em dia (nenhum vencido), para o histórico não depender de a tela
    // ter sido aberta. Chamado quando um contato é registrado, quando um lead responde e no lembrete das 8h.
    async sincronizarHoje(tenantId) {
        const dia = diaDe()
        if (!diaUtil(dia)) return
        const ids = (await rotinaDoNegocio(tenantId)).linhas.filter((linha) => linha.auto === 'followUp').map((linha) => linha.id)
        if (!ids.length) return
        const emDia = (await followUpsVencidos(tenantId)) === 0
        await RotinaDiaModel.updateOne(
            { tenantId, dia },
            emDia ? { $addToSet: { feitas: { $each: ids } } } : { $pull: { feitas: { $in: ids } } },
            { upsert: true },
        )
    },

    async painel(tenantId) {
        const hoje = diaDe()
        await this.sincronizarHoje(tenantId)
        const segunda = segundaDe(hoje)
        const primeiroRegistro = await RotinaDiaModel.findOne({ tenantId }).sort({ dia: 1 }).lean()
        const inicio = [somarDias(hoje, -DIAS_DA_CONSTANCIA), primeiroRegistro?.dia ?? hoje].sort().at(-1)

        const { linhas } = await rotinaDoNegocio(tenantId)
        const metaLeads = metaDe(linhas, 'leads')
        const metaContatos = metaDe(linhas, 'primeirosContatos')
        const [dias, porSituacao, contatados, paraEncerrar, parceiros, parceirosAtivos] = await Promise.all([
            diasMontados(tenantId, linhas, [inicio, segunda].sort()[0], hoje),
            LeadModel.aggregate([{ $match: { tenantId: idDaConta(tenantId) } }, { $group: { _id: '$status', total: { $sum: 1 } } }]),
            // Inclui quem recebeu e-mail antes de existir a contagem de contatos.
            LeadModel.countDocuments({ tenantId, $or: [{ numeroContatos: { $gt: 0 } }, { ultimoEnvioEm: { $ne: null } }, { status: { $nin: ['novo', 'descartado'] } }] }),
            LeadModel.countDocuments({ tenantId, ...filtroFollowUp('encerrar') }),
            ParceiroModel.countDocuments({ tenantId }),
            ParceiroModel.countDocuments({ tenantId, status: 'parceiro_ativo' }),
        ])

        const diaDeHoje = dias.at(-1)
        const semana = dias.filter((dia) => dia.dia >= segunda && dia.util)
        const passados = dias.filter((dia) => dia.dia >= inicio && dia.dia < hoje && dia.util)
        const comHoje = diaDeHoje.util ? [...passados, diaDeHoje] : passados
        const situacao = Object.fromEntries(porSituacao.map((linha) => [linha._id, linha.total]))
        const soma = (...nomes) => nomes.reduce((total, nome) => total + (situacao[nome] ?? 0), 0)

        return {
            hoje: {
                dia: hoje,
                percentual: diaDeHoje.percentual,
                leads: diaDeHoje.contagens.leads,
                metaLeads,
                primeirosContatos: diaDeHoje.contagens.primeirosContatos,
                metaContatos,
                followUpsPendentes: diaDeHoje.followUpsPendentes ?? await followUpsVencidos(tenantId),
                paraEncerrar,
            },
            semana: {
                leads: semana.reduce((total, dia) => total + dia.contagens.leads, 0),
                metaLeads: metaLeads && metaLeads * 5,
                primeirosContatos: semana.reduce((total, dia) => total + dia.contagens.primeirosContatos, 0),
                metaContatos: metaContatos && metaContatos * 5,
                mediaRotina: semana.length ? Math.round(semana.reduce((total, dia) => total + dia.percentual, 0) / semana.length) : 0,
            },
            funil: {
                leads: soma(...Object.keys(situacao)),
                contatados,
                responderam: soma('respondeu', 'follow_up', 'interessado', 'demo', 'teste_gratis', 'cliente'),
                demos: soma('demo', 'teste_gratis', 'cliente'),
                testeGratis: soma('teste_gratis'),
                clientes: soma('cliente'),
                perdidos: soma('descartado'),
            },
            constancia: {
                dias100: comHoje.filter((dia) => dia.percentual === 100).length,
                dias80: comHoje.filter((dia) => dia.percentual >= 80).length,
                diasAbaixoDe50: passados.filter((dia) => dia.percentual < 50).length,
            },
            parceiros: { listados: parceiros, ativos: parceirosAtivos },
        }
    },
}
