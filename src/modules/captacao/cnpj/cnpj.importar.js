import CnpjModel from './cnpj.model.js'
import CnpjImportacaoModel from './cnpj-importacao.model.js'
import CnaeModel, { semAcento } from './cnae.model.js'
import NegocioModel from '../../negocio/negocio.model.js'
import { APELIDOS_DE_CNAE, CNAES_PADRAO } from './cnpj.cnaes.js'
import { baixarZip, competenciasPublicadas, linhasDoZip } from './cnpj.zip.js'

// Importa a base aberta de CNPJs da Receita (publicada todo mês, ~7 GB em zips): lê em fluxo, sem gravar em disco,
// e guarda só os estabelecimentos ATIVOS, abertos nos últimos MESES_DE_ABERTURA meses e nas atividades (CNAE) que
// interessam: as da saúde (CNAES_PADRAO) e as que algum negócio escolheu na Captação (negocio.cnaesCnpj).
const MESES_DE_ABERTURA = 3
const PARTES = Array.from({ length: 10 }, (_, i) => i)
const TAMANHO_DO_LOTE = 1000
const TENTATIVAS = 3
const ATIVA = '02'

// Colunas do arquivo de estabelecimentos (layout da Receita).
const C = { basico: 0, ordem: 1, dv: 2, fantasia: 4, situacao: 5, abertura: 10, cnae: 11, tipoLogradouro: 13, logradouro: 14, numero: 15, complemento: 16, bairro: 17, cep: 18, uf: 19, municipio: 20, ddd1: 21, tel1: 22, ddd2: 23, tel2: 24, email: 27 }

function telefone(ddd, numero) {
    const digitos = `${ddd}${numero}`.replace(/\D/g, '')
    if (digitos.length < 10) return ''
    const [d, n] = [digitos.slice(0, 2), digitos.slice(2)]
    return `(${d}) ${n.slice(0, -4)}-${n.slice(-4)}`
}

function juntar(...partes) {
    return partes.map((parte) => String(parte ?? '').trim()).filter(Boolean).join(' ')
}

// Do dia 1º do mês, contando o mês atual: com 3 meses, em novembro o corte é 1º de setembro.
function corteDeAbertura() {
    const data = new Date()
    data.setUTCDate(1)
    data.setUTCMonth(data.getUTCMonth() - (MESES_DE_ABERTURA - 1))
    return data.toISOString().slice(0, 10).replace(/-/g, '')
}

// Tenta de novo quando a conexão com a Receita cai no meio (acontece): como tudo é gravado por CNPJ, repetir não duplica.
async function comTentativas(nome, log, acao) {
    for (let tentativa = 1; ; tentativa++) {
        try {
            return await acao()
        } catch (erro) {
            if (tentativa >= TENTATIVAS) throw erro
            log.warn(`CNPJ: ${nome} falhou (${erro.message}); tentando de novo (${tentativa + 1}/${TENTATIVAS})`)
            await new Promise((resolve) => setTimeout(resolve, 30000 * tentativa))
        }
    }
}

async function lerMunicipios(competencia) {
    const nomes = {}
    for await (const [codigo, nome] of linhasDoZip(await baixarZip(competencia, 'Municipios.zip'))) nomes[codigo] = nome
    return nomes
}

// Atividades que a importação traz: as padrão e as escolhidas pelos negócios.
export async function cnaesDesejados() {
    const escolhidos = await NegocioModel.distinct('cnaesCnpj')
    return [...new Set([...CNAES_PADRAO, ...escolhidos])].sort()
}

// Lista oficial de atividades (arquivo pequeno): serve para a busca pelo nome na tela.
export async function importarCnaes(competencia) {
    competencia ??= (await competenciasPublicadas())[0]
    const lote = []
    for await (const [codigo, descricao] of linhasDoZip(await baixarZip(competencia, 'Cnaes.zip'))) {
        if (!/^\d{7}$/.test(codigo)) continue
        lote.push({ updateOne: { filter: { _id: codigo }, update: { $set: { descricao: descricao.trim(), busca: semAcento(`${codigo} ${descricao} ${APELIDOS_DE_CNAE[codigo] ?? ''}`) } }, upsert: true } })
    }
    if (lote.length) await CnaeModel.bulkWrite(lote, { ordered: false })
    return lote.length
}

async function importarEstabelecimentos(competencia, parte, municipios, corte, basicos, cnaes) {
    let lote = []
    let total = 0
    const gravar = async () => {
        if (!lote.length) return
        await CnpjModel.bulkWrite(lote, { ordered: false })
        total += lote.length
        lote = []
    }
    for await (const c of linhasDoZip(await baixarZip(competencia, `Estabelecimentos${parte}.zip`))) {
        if (c[C.situacao] !== ATIVA || !(c[C.abertura] >= corte) || !cnaes.has(c[C.cnae])) continue
        const cnpj = `${c[C.basico]}${c[C.ordem]}${c[C.dv]}`
        const abertura = `${c[C.abertura].slice(0, 4)}-${c[C.abertura].slice(4, 6)}-${c[C.abertura].slice(6, 8)}`
        basicos.add(c[C.basico])
        lote.push({
            updateOne: {
                filter: { _id: cnpj },
                update: {
                    $set: {
                        basico: c[C.basico],
                        fantasia: c[C.fantasia].trim(),
                        cnae: c[C.cnae],
                        abertura,
                        uf: c[C.uf],
                        municipio: municipios[c[C.municipio]] ?? '',
                        bairro: c[C.bairro].trim(),
                        endereco: juntar(c[C.tipoLogradouro], c[C.logradouro], c[C.numero], c[C.complemento]),
                        cep: c[C.cep],
                        telefone: telefone(c[C.ddd1], c[C.tel1]),
                        telefone2: telefone(c[C.ddd2], c[C.tel2]),
                        email: c[C.email].trim().toLowerCase(),
                        competencia,
                    },
                },
                upsert: true,
            },
        })
        if (lote.length >= TAMANHO_DO_LOTE) await gravar()
    }
    await gravar()
    return total
}

// A razão social fica no arquivo de empresas, ligado pelos 8 primeiros dígitos (CNPJ básico).
async function importarRazoesSociais(competencia, parte, basicos) {
    let lote = []
    const gravar = async () => {
        if (!lote.length) return
        await CnpjModel.bulkWrite(lote, { ordered: false })
        lote = []
    }
    for await (const [basico, razaoSocial] of linhasDoZip(await baixarZip(competencia, `Empresas${parte}.zip`))) {
        if (!basicos.has(basico)) continue
        lote.push({ updateMany: { filter: { basico }, update: { $set: { razaoSocial: razaoSocial.trim() } } } })
        if (lote.length >= TAMANHO_DO_LOTE) await gravar()
    }
    await gravar()
}

// Importa a competência mais nova, se ainda não foi, ou de novo quando algum negócio escolheu uma atividade que a
// última importação não trouxe. Devolve a competência importada (ou null se não havia nada a fazer).
export async function importarCnpjs(log = console, { forcar = false } = {}) {
    const [competencia] = await competenciasPublicadas()
    if (!competencia) throw new Error('Nenhuma competência publicada pela Receita')
    const anterior = await CnpjImportacaoModel.findById(competencia).lean()
    const cnaes = await cnaesDesejados()
    const faltaAtividade = cnaes.some((cnae) => !anterior?.cnaes?.includes(cnae))
    if (!forcar && anterior?.status === 'concluida' && !faltaAtividade) return null
    // Outra importação em andamento há menos de 12 h: não começa outra.
    if (!forcar && anterior?.status === 'importando' && Date.now() - new Date(anterior.iniciadaEm).getTime() < 12 * 3600 * 1000) return null

    await CnpjImportacaoModel.updateOne({ _id: competencia }, { $set: { status: 'importando', iniciadaEm: new Date(), erro: '' } }, { upsert: true })
    log.info(`CNPJ: importando a base ${competencia} (${cnaes.length} atividades)`)
    try {
        const corte = corteDeAbertura()
        await comTentativas('Cnaes.zip', log, () => importarCnaes(competencia))
        const municipios = await comTentativas('Municipios.zip', log, () => lerMunicipios(competencia))
        const basicos = new Set()
        let total = 0
        for (const parte of PARTES) {
            total += await comTentativas(`Estabelecimentos${parte}.zip`, log, () => importarEstabelecimentos(competencia, parte, municipios, corte, basicos, new Set(cnaes)))
            log.info(`CNPJ: Estabelecimentos${parte} lido (${total} até agora)`)
        }
        for (const parte of PARTES) {
            await comTentativas(`Empresas${parte}.zip`, log, () => importarRazoesSociais(competencia, parte, basicos))
        }
        // O que não veio nesta competência fechou, mudou de atividade ou ficou velho demais.
        await CnpjModel.deleteMany({ competencia: { $ne: competencia } })
        await CnpjImportacaoModel.updateOne({ _id: competencia }, { $set: { status: 'concluida', concluidaEm: new Date(), estabelecimentos: total, cnaes } })
        log.info(`CNPJ: base ${competencia} importada (${total} estabelecimentos)`)
        return competencia
    } catch (erro) {
        await CnpjImportacaoModel.updateOne({ _id: competencia }, { $set: { status: 'erro', erro: erro.message } })
        throw erro
    }
}

export async function ultimaImportacao() {
    return CnpjImportacaoModel.findOne({ status: 'concluida' }).sort({ _id: -1 }).lean()
}
