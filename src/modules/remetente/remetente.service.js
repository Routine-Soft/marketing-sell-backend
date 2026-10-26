import RemetenteModel from './remetente.model.js'
import EnvioModel from '../envio/envio.model.js'
import LeadModel from '../lead/lead.model.js'
import AppError from '../../errors/AppError.js'
import { criptografar } from '../shared/utils/criptografia.js'
import { criarRemetenteDTO, editarRemetenteDTO } from './remetente.dto.js'
import { cotaDoEmail } from '../envio/envio.cota.js'
import { enviarPeloGmail, esquecerTransporter } from '../envio/envio.gmail.js'
import { LEAD_EXEMPLO, montarAssunto, montarCorpo } from '../envio/envio.template.js'

async function buscarRemetenteOuFalhar(tenantId, id) {
    const remetente = await RemetenteModel.findOne({ _id: id, tenantId })
    if (!remetente) throw new AppError('Remetente não encontrado', 404)
    return remetente
}

export const RemetenteService = {
    async listar(tenantId) {
        return RemetenteModel.find({ tenantId }).sort({ nomeNegocio: 1 })
    },

    // Cota diária por Gmail (não por remetente: dois negócios no mesmo Gmail somam no mesmo limite).
    async cotas(tenantId) {
        const remetentes = await RemetenteModel.find({ tenantId }, 'email')
        const emails = [...new Set(remetentes.map((r) => r.email))]
        return Promise.all(emails.map(async (email) => ({ email, ...(await cotaDoEmail(email)) })))
    },

    async criar(tenantId, body) {
        const dados = criarRemetenteDTO(body)
        const jaExiste = await RemetenteModel.findOne({ tenantId, nomeNegocio: dados.nomeNegocio })
        if (jaExiste) throw new AppError('Já existe um remetente com esse nome de negócio', 400)

        return RemetenteModel.create({
            ...dados,
            tenantId,
            senhaApp: criptografar(dados.senhaApp),
        })
    },

    async editar(tenantId, id, body) {
        const remetente = await buscarRemetenteOuFalhar(tenantId, id)
        const dados = editarRemetenteDTO(body)
        if (dados.senhaApp || (dados.email && dados.email !== remetente.email)) esquecerTransporter(remetente.email)
        if (dados.senhaApp) dados.senhaApp = criptografar(dados.senhaApp)
        Object.assign(remetente, dados)
        await remetente.save()
        return remetente
    },

    // O que ainda estava na fila deste remetente não sai mais.
    async excluir(tenantId, id) {
        const remetente = await buscarRemetenteOuFalhar(tenantId, id)
        esquecerTransporter(remetente.email)
        const pendentes = await EnvioModel.find({ remetenteId: remetente._id, status: 'na_fila' }, 'leadId')
        await EnvioModel.deleteMany({ _id: { $in: pendentes.map((e) => e._id) } })
        await LeadModel.updateMany({ _id: { $in: pendentes.map((e) => e.leadId).filter(Boolean) } }, { $set: { envioPendente: false } })
        await remetente.deleteOne()
    },

    // Sai na hora (sem fila), com o assunto, o corpo e o rodapé preenchidos com um lead de exemplo.
    async enviarTeste(tenantId, id, para) {
        const remetente = await buscarRemetenteOuFalhar(tenantId, id)
        const destino = String(para ?? '').trim() || remetente.email

        const cota = await cotaDoEmail(remetente.email)
        if (cota.restante <= 0) {
            throw new AppError(`Limite diário de ${cota.limite} e-mails do Gmail atingido para ${remetente.email}`, 429)
        }

        const assunto = montarAssunto(remetente.assuntoPadrao, LEAD_EXEMPLO) || 'Teste de envio - Marketing Sell'
        const corpoHtml = montarCorpo(remetente.corpoPadrao || 'Este é um e-mail de teste do Marketing Sell.', remetente.rodape, LEAD_EXEMPLO)
        try {
            await enviarPeloGmail(remetente, { para: destino, assunto, corpoHtml })
        } catch {
            throw new AppError('Não foi possível enviar o e-mail. Confira a senha de app do Gmail', 400)
        }

        await EnvioModel.create({
            tenantId,
            remetenteId: remetente._id,
            email: remetente.email,
            para: destino,
            assunto,
            corpoHtml,
            status: 'enviado',
            enviadoEm: new Date(),
        })
        return destino
    },
}
