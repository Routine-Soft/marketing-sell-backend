import mongoose from 'mongoose'
import RotinaDiaModel from './rotina-dia.model.js'
import LeadModel from '../lead/lead.model.js'
import ContatoModel from '../lead/contato.model.js'
import { filtroFollowUp } from '../lead/lead.contato.js'
import ParceiroModel from '../parceiro/parceiro.model.js'
import { LINHAS, META_LEADS, META_CONTATOS } from './rotina.tarefas.js'
import { diaDe, diaDaSemana, diaUtil, diaValido, fimDoDia, inicioDoDia, somarDias } from '../shared/utils/dia.js'
import AppError from '../../errors/AppError.js'

const FUSO = '-03:00'
const DIAS_DA_CONSTANCIA = 30
const MAXIMO_DE_DIAS = 45
const SEM_CONTAGEM = { leads: 0, primeirosContatos: 0, followUps: 0, parceiros: 0 }

function segundaDe(dia) {
    return somarDias(dia, -((diaDaSemana(dia) + 6) % 7))
}

function idDaConta(tenantId) {
    return new mongoose.Types.ObjectId(String(tenantId))
}

function valeNoDia(linha, dia) {
    return diaUtil(dia) && (!linha.dias || linha.dias.includes(diaDaSemana(dia)))
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

// Um dia da grade: o que está feito (marcado pela pessoa ou pelo sistema), as contagens e o % das tarefas.
// followUpsPendentes só existe para hoje: nos outros dias, o follow-up vale o que ficou gravado.
function montarDia(dia, contagens = SEM_CONTAGEM, marcadas = [], followUpsPendentes = null) {
    const feita = (linha) => {
        if (linha.auto === 'followUp') return followUpsPendentes === null ? marcadas.includes(linha.id) : followUpsPendentes === 0
        if (linha.auto) return contagens[linha.auto] >= linha.meta
        return marcadas.includes(linha.id)
    }
    const doDia = LINHAS.filter((linha) => linha.tipo !== 'automatico' && valeNoDia(linha, dia))
    const feitas = doDia.filter(feita).map((linha) => linha.id)
    const tarefas = doDia.filter((linha) => linha.tipo === 'tarefa')
    const concluidas = tarefas.filter((linha) => feitas.includes(linha.id)).length
    return {
        dia,
        util: diaUtil(dia),
        feitas,
        contagens,
        followUpsPendentes,
        percentual: tarefas.length ? Math.round((concluidas / tarefas.length) * 100) : 0,
    }
}

async function diasMontados(tenantId, primeiroDia, ultimoDia) {
    const hoje = diaDe()
    const [contagens, registros, pendentes] = await Promise.all([
        contagensPorDia(tenantId, primeiroDia, ultimoDia),
        RotinaDiaModel.find({ tenantId, dia: { $gte: primeiroDia, $lte: ultimoDia } }).lean(),
        hoje >= primeiroDia && hoje <= ultimoDia ? followUpsVencidos(tenantId) : null,
    ])
    const feitasPorDia = Object.fromEntries(registros.map((registro) => [registro.dia, registro.feitas]))
    const dias = []
    for (let dia = primeiroDia; dia <= ultimoDia; dia = somarDias(dia, 1)) {
        dias.push(montarDia(dia, contagens[dia], feitasPorDia[dia], dia === hoje ? pendentes : null))
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
        const [dias, primeiroRegistro] = await Promise.all([
            diasMontados(tenantId, de, ate),
            RotinaDiaModel.findOne({ tenantId }).sort({ dia: 1 }).lean(),
        ])
        // inicio = primeiro dia em que a conta usou a rotina: antes dele a tela não pinta o dia como "não feito".
        return { hoje, de, ate, inicio: primeiroRegistro?.dia ?? hoje, linhas: LINHAS, dias: dias.filter((dia) => dia.util) }
    },

    async marcar(tenantId, texto, body) {
        const dia = diaDTO(texto)
        const linha = LINHAS.find((item) => item.id === body?.linhaId && valeNoDia(item, dia))
        if (!linha) throw new AppError('Tarefa não encontrada neste dia', 404)
        if (linha.auto || linha.tipo === 'automatico') throw new AppError('Esta tarefa é marcada sozinha pelo sistema', 400)
        await RotinaDiaModel.updateOne(
            { tenantId, dia },
            body.feita ? { $addToSet: { feitas: linha.id } } : { $pull: { feitas: linha.id } },
            { upsert: true },
        )
        const [montado] = await diasMontados(tenantId, dia, dia)
        return montado
    },

    // Grava no dia de hoje se o follow-up está em dia (nenhum vencido), para o histórico não depender de a tela
    // ter sido aberta. Chamado quando um contato é registrado, quando um lead responde e no lembrete das 8h.
    async sincronizarHoje(tenantId) {
        const dia = diaDe()
        if (!diaUtil(dia)) return
        const emDia = (await followUpsVencidos(tenantId)) === 0
        await RotinaDiaModel.updateOne(
            { tenantId, dia },
            emDia ? { $addToSet: { feitas: 'follow_up' } } : { $pull: { feitas: 'follow_up' } },
            { upsert: true },
        )
    },

    async painel(tenantId) {
        const hoje = diaDe()
        await this.sincronizarHoje(tenantId)
        const segunda = segundaDe(hoje)
        const primeiroRegistro = await RotinaDiaModel.findOne({ tenantId }).sort({ dia: 1 }).lean()
        const inicio = [somarDias(hoje, -DIAS_DA_CONSTANCIA), primeiroRegistro?.dia ?? hoje].sort().at(-1)

        const [dias, porSituacao, contatados, paraEncerrar, parceiros, parceirosAtivos] = await Promise.all([
            diasMontados(tenantId, [inicio, segunda].sort()[0], hoje),
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
                metaLeads: META_LEADS,
                primeirosContatos: diaDeHoje.contagens.primeirosContatos,
                metaContatos: META_CONTATOS,
                followUpsPendentes: diaDeHoje.followUpsPendentes ?? await followUpsVencidos(tenantId),
                paraEncerrar,
            },
            semana: {
                leads: semana.reduce((total, dia) => total + dia.contagens.leads, 0),
                metaLeads: META_LEADS * 5,
                primeirosContatos: semana.reduce((total, dia) => total + dia.contagens.primeirosContatos, 0),
                metaContatos: META_CONTATOS * 5,
                mediaRotina: semana.length ? Math.round(semana.reduce((total, dia) => total + dia.percentual, 0) / semana.length) : 0,
            },
            funil: {
                leads: soma(...Object.keys(situacao)),
                contatados,
                responderam: soma('respondeu', 'interessado', 'demo', 'teste_gratis', 'cliente'),
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
