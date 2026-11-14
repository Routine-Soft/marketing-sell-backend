import LeadModel, { SEM_RESPOSTA } from './lead.model.js'
import ContatoModel from './contato.model.js'
import EnvioModel from '../envio/envio.model.js'

const DIA_MS = 24 * 60 * 60 * 1000
// Follow-up 3, 7 e 14 dias depois do primeiro contato. Depois do 4º contato sem resposta, o lead fica "para encerrar".
const DIAS_FOLLOW_UP = [3, 7, 14]
export const MAXIMO_DE_CONTATOS = DIAS_FOLLOW_UP.length + 1

export function proximoFollowUp(primeiroContatoEm, numeroContatos) {
    const dias = DIAS_FOLLOW_UP[numeroContatos - 1]
    return dias ? new Date(primeiroContatoEm.getTime() + dias * DIA_MS) : null
}

// Registra um contato com o lead: conta, grava as datas, marca o próximo follow-up e avança "novo" para "contatado".
// Quem já respondeu (ou virou cliente, foi descartado...) não ganha follow-up.
export async function registrarContato(lead, canal, { automatico = false, quando = new Date() } = {}) {
    lead.primeiroContatoEm ??= quando
    lead.canalPrimeiroContato ||= canal
    lead.ultimoContatoEm = quando
    lead.numeroContatos += 1
    if (lead.status === 'novo') lead.status = 'contatado'
    lead.proximoFollowUpEm = SEM_RESPOSTA.includes(lead.status) ? proximoFollowUp(lead.primeiroContatoEm, lead.numeroContatos) : null
    await lead.save()
    await ContatoModel.create({ tenantId: lead.tenantId, leadId: lead._id, canal, numero: lead.numeroContatos, automatico, em: quando })
    return lead
}

// Tira o lead do follow-up (respondeu, avançou ou foi descartado); se respondeu, guarda quando.
// E-mails que ainda estavam na fila para ele não saem mais. Quem chama salva o lead.
export async function pararFollowUp(lead, quando = new Date()) {
    lead.proximoFollowUpEm = null
    if (lead.status !== 'descartado') lead.respondeuEm ??= quando
    lead.envioPendente = false
    await EnvioModel.deleteMany({ leadId: lead._id, status: 'na_fila' })
}

// Filtros prontos da lista: follow-up vencido (até o fim do dia informado) e leads para encerrar.
export function filtroFollowUp(tipo, ate) {
    if (tipo === 'vencido') return { status: { $in: SEM_RESPOSTA }, proximoFollowUpEm: { $ne: null, $lt: ate } }
    if (tipo === 'encerrar') return { status: 'contatado', numeroContatos: { $gte: MAXIMO_DE_CONTATOS } }
    return null
}

export function leadsComFollowUpVencido(tenantId, ate) {
    return LeadModel.find({ tenantId, ...filtroFollowUp('vencido', ate) }).sort({ proximoFollowUpEm: 1 })
}
