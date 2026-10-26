import EnvioModel from './envio.model.js'
import RemetenteModel from '../remetente/remetente.model.js'
import LeadModel from '../lead/lead.model.js'
import AppError from '../../errors/AppError.js'
import { cotaDoEmail } from './envio.cota.js'
import { montarAssunto, montarCorpo } from './envio.template.js'
import { enviarDTO, previaDTO } from './envio.dto.js'

async function remetenteDaConta(tenantId, id) {
    const remetente = await RemetenteModel.findOne({ _id: id, tenantId })
    if (!remetente) throw new AppError('Remetente não encontrado', 404)
    return remetente
}

// Leads selecionados que têm e-mail, e quais deles já receberam (ou estão na fila) deste mesmo negócio.
async function separarLeads(tenantId, remetenteId, ids) {
    const leads = await LeadModel.find({ _id: { $in: ids }, tenantId }, 'nome contato cidade email')
    const comEmail = leads.filter((l) => l.email)
    const jaRecebeu = await EnvioModel.distinct('leadId', {
        tenantId,
        remetenteId,
        leadId: { $in: comEmail.map((l) => l._id) },
        status: { $in: ['na_fila', 'enviando', 'enviado'] },
    })
    const recebidos = new Set(jaRecebeu.map(String))
    return {
        total: leads.length,
        comEmail,
        jaRecebeu: comEmail.filter((l) => recebidos.has(String(l._id))),
        novos: comEmail.filter((l) => !recebidos.has(String(l._id))),
    }
}

export const EnvioService = {
    async previa(tenantId, body) {
        const { remetenteId, ids } = previaDTO(body)
        const remetente = await remetenteDaConta(tenantId, remetenteId)
        const { total, comEmail, jaRecebeu } = await separarLeads(tenantId, remetente._id, ids)
        return {
            selecionados: total,
            comEmail: comEmail.length,
            semEmail: total - comEmail.length,
            jaRecebeu: jaRecebeu.length,
            cota: await cotaDoEmail(remetente.email),
        }
    },

    async enfileirar(tenantId, body) {
        const { remetenteId, ids, assunto, corpo, reenviar } = enviarDTO(body)
        const remetente = await remetenteDaConta(tenantId, remetenteId)
        if (!remetente.ativo) throw new AppError('Este remetente está desativado', 400)

        const { comEmail, novos } = await separarLeads(tenantId, remetente._id, ids)
        const leads = reenviar ? comEmail : novos
        if (!comEmail.length) throw new AppError('Nenhum dos leads selecionados tem e-mail', 400)
        if (!leads.length) throw new AppError('Todos os leads selecionados já receberam e-mail deste negócio', 400)

        await EnvioModel.insertMany(leads.map((lead) => ({
            tenantId,
            remetenteId: remetente._id,
            leadId: lead._id,
            email: remetente.email,
            para: lead.email,
            assunto: montarAssunto(assunto, lead),
            corpoHtml: montarCorpo(corpo, remetente.rodape, lead),
            status: 'na_fila',
        })))
        await LeadModel.updateMany({ _id: { $in: leads.map((l) => l._id) } }, { $set: { envioPendente: true, envioErro: '' } })
        return leads.length
    },

    // Tira da fila o que ainda não saiu de um Gmail da conta.
    async cancelarFila(tenantId, email) {
        const pendentes = await EnvioModel.find({ tenantId, email: String(email ?? ''), status: 'na_fila' }, 'leadId')
        if (!pendentes.length) return 0
        await EnvioModel.deleteMany({ _id: { $in: pendentes.map((e) => e._id) }, status: 'na_fila' })
        await LeadModel.updateMany({ _id: { $in: pendentes.map((e) => e.leadId).filter(Boolean) } }, { $set: { envioPendente: false } })
        return pendentes.length
    },
}
