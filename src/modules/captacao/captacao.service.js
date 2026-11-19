import BuscaModel from './busca.model.js'
import LeadModel from '../lead/lead.model.js'
import { EmailSiteService } from '../email-site/email-site.service.js'
import { FONTES, OPCOES_DAS_FONTES } from './fontes/index.js'
import { cotaGoogle } from './captacao.cota.js'
import { buscaDTO } from './captacao.dto.js'
import AppError from '../../errors/AppError.js'

// Grava os leads da busca sem repetir o que a conta já tem (mesma fonte + mesmo idExterno).
// Lead que já existia fica como está, com o status e as anotações que a equipe já deu.
async function salvarLeads(tenantId, fonte, buscaId, leads) {
    const unicos = [...new Map(leads.map((lead) => [lead.idExterno, lead])).values()]
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


    async opcoes(contaId, tenantId) {
        return {
            ...OPCOES_DAS_FONTES,
            fontes: Object.values(FONTES).map((f) => ({ id: f.id, nome: f.nome })),
            googleConfigurado: !!process.env.GOOGLE_API_KEY,
            cotaGoogle: await cotaGoogle(contaId),
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
