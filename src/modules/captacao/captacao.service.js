import BuscaModel from './busca.model.js'
import LeadModel from '../lead/lead.model.js'
import { EmailSiteService } from '../email-site/email-site.service.js'
import { FONTES, OPCOES_DAS_FONTES } from './fontes/index.js'
import { cotaGoogle } from './captacao.cota.js'
import { ultimaImportacao } from './cnpj/cnpj.importar.js'
import CnaeModel, { semAcento } from './cnpj/cnae.model.js'
import CnpjModel from './cnpj/cnpj.model.js'
import NegocioModel from '../negocio/negocio.model.js'
import { buscaDTO } from './captacao.dto.js'
import AppError from '../../errors/AppError.js'

// Grava os leads da busca sem repetir o que a conta já tem (mesma fonte + mesmo idExterno).
// Lead que já existia fica como está, com o status e as anotações que a equipe já deu.
// Fonte com conferirTelefone (CNPJ): telefone que a conta já tem em outro lead também conta como repetido.
async function salvarLeads(tenantId, fonte, buscaId, leads) {
    let unicos = [...new Map(leads.map((lead) => [lead.idExterno, lead])).values()]
    if (FONTES[fonte]?.conferirTelefone) {
        const telefones = unicos.map((lead) => lead.telefone).filter(Boolean)
        const existentes = await LeadModel.find({ tenantId, telefone: { $in: telefones } }, 'telefone idExterno fonte').lean()
        const jaTem = new Set(existentes.filter((lead) => lead.fonte !== fonte).map((lead) => lead.telefone))
        const vistos = new Set()
        unicos = unicos.filter((lead) => {
            if (!lead.telefone) return true
            if (jaTem.has(lead.telefone) || vistos.has(lead.telefone)) return false
            vistos.add(lead.telefone)
            return true
        })
    }
    if (!unicos.length) return 0

    // A fonte já manda do mais recente ao mais antigo: cada lead ganha 1 ms a menos que o anterior, para a lista
    // (ordenada por createdAt) mostrar na mesma ordem.
    const agora = Date.now()
    const resultado = await LeadModel.bulkWrite(unicos.map((lead, indice) => {
        const criadoEm = new Date(agora - indice)
        return {
            updateOne: {
                filter: { tenantId, fonte, idExterno: lead.idExterno },
                update: {
                    $setOnInsert: {
                        ...lead,
                        tenantId,
                        fonte,
                        buscaId,
                        emailStatus: lead.email ? 'encontrado' : 'nao_buscado',
                        createdAt: criadoEm,
                        updatedAt: criadoEm,
                    },
                },
                upsert: true,
                timestamps: false,
            },
        }
    }), { ordered: false })
    return resultado.upsertedCount
}

export const CaptacaoService = {
    // Atividades pelo nome ou código (para escolher na fonte de CNPJs).
    async cnaes(busca) {
        const termo = semAcento(busca).trim()
        if (termo.length < 2) return []
        const palavras = termo.split(/\s+/).map((palavra) => new RegExp(palavra.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
        const lista = await CnaeModel.find({ $and: palavras.map((regex) => ({ busca: regex })) }).lean()
        // Primeiro as atividades em que a palavra aparece mais cedo (ex.: "odonto" traz "Atividade odontológica"
        // antes de "Fabricação de instrumentos... odontológico").
        const posicao = (cnae) => {
            if (cnae._id.startsWith(termo)) return -1
            const indice = cnae.busca.indexOf(termo.split(/\s+/)[0], 8)
            return indice === -1 ? 9999 : indice
        }
        return lista.sort((a, b) => posicao(a) - posicao(b)).slice(0, 30).map((cnae) => ({ codigo: cnae._id, descricao: cnae.descricao }))
    },

    // Atividades da busca de CNPJs: as que já estão na base (com quantas empresas cada uma tem, das que têm mais para as
    // que têm menos) e, depois, as que o negócio acrescentou e ainda não estão na base (total 0).
    async atividadesDoNegocio(tenantId) {
        const [negocio, naBase] = await Promise.all([
            NegocioModel.findById(tenantId, 'cnaesCnpj').lean(),
            CnpjModel.aggregate([{ $group: { _id: '$cnae', total: { $sum: 1 } } }, { $sort: { total: -1, _id: 1 } }]),
        ])
        const totais = Object.fromEntries(naBase.map((item) => [item._id, item.total]))
        const codigos = [...naBase.map((item) => item._id), ...(negocio?.cnaesCnpj ?? []).filter((codigo) => !totais[codigo])]
        const lista = await CnaeModel.find({ _id: { $in: codigos } }).lean()
        const nomes = Object.fromEntries(lista.map((cnae) => [cnae._id, cnae.descricao]))
        return codigos.map((codigo) => ({ codigo, descricao: nomes[codigo] ?? '', total: totais[codigo] ?? 0 }))
    },

    async opcoes(contaId, tenantId) {
        return {
            ...OPCOES_DAS_FONTES,
            fontes: Object.values(FONTES).map((f) => ({ id: f.id, nome: f.nome })),
            googleConfigurado: !!process.env.GOOGLE_API_KEY,
            cotaGoogle: await cotaGoogle(contaId),
            baseCnpj: await ultimaImportacao().then((base) => base && { _id: base._id, estabelecimentos: base.estabelecimentos }),
            atividadesCnpj: await this.atividadesDoNegocio(tenantId),
        }
    },

    async buscar(tenantId, contaId, usuarioId, body) {
        const { fonte, filtros, buscarEmails } = buscaDTO(body)

        let paginasDisponiveis = 0
        if (fonte.id === 'google') {
            paginasDisponiveis = (await cotaGoogle(contaId)).restante
            if (paginasDisponiveis <= 0) {
                throw new AppError('A cota de buscas no Google deste mês acabou. Fale com o suporte para aumentar.', 429)
            }
        }

        const resultado = await fonte.buscar(filtros, { paginasDisponiveis })
        const { leads } = resultado

        const busca = await BuscaModel.create({
            tenantId,
            usuarioId,
            fonte: fonte.id,
            filtros: resultado.filtros,
            encontrados: leads.length,
            requisicoesGoogle: resultado.requisicoesGoogle,
        })
        busca.novos = await salvarLeads(tenantId, fonte.id, busca._id, leads)
        await busca.save()

        const emailsNaFila = buscarEmails ? await EmailSiteService.enfileirar(tenantId, { buscaId: busca._id }) : 0
        return { busca, emailsNaFila }
    },
}
