import LeadModel from '../lead/lead.model.js'
import ContatoModel from '../lead/contato.model.js'
import WhatsappEnvioModel from './whatsapp-envio.model.js'
import { diaDe, inicioDoDia } from '../shared/utils/dia.js'

// Leads que a regra do negócio alcança: nas situações e fontes escolhidas, com telefone, que nunca receberam a
// mensagem automática e com quem a conta ainda não falou pelo WhatsApp à mão (registrado como contato).
export async function filtroDaRegra(config) {
    const jaFalou = await ContatoModel.distinct('leadId', { tenantId: config.tenantId, canal: 'whatsapp' })
    return {
        tenantId: config.tenantId,
        status: { $in: config.situacoes },
        ...(config.fontes?.length ? { fonte: { $in: config.fontes } } : {}),
        telefone: { $ne: '' },
        whatsappEm: null,
        ...(jaFalou.length ? { _id: { $nin: jaFalou } } : {}),
    }
}

// Mensagens automáticas que saíram hoje (dia de Brasília) pelo negócio.
export function enviadosHoje(tenantId) {
    return WhatsappEnvioModel.countDocuments({ tenantId, teste: false, status: 'enviado', createdAt: { $gte: inicioDoDia(diaDe()) } })
}

export async function proximoLeadDaRegra(config) {
    return LeadModel.findOne(await filtroDaRegra(config)).sort({ createdAt: 1 })
}

export async function quantosNaRegra(config) {
    return LeadModel.countDocuments(await filtroDaRegra(config))
}
