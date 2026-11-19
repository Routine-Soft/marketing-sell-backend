import { WhatsappService } from './whatsapp.service.js'

export const WhatsappController = {
    async situacao(req, reply) {
        return reply.send({ success: true, data: await WhatsappService.situacao(req.user.tenantId) })
    },

    async conectar(req, reply) {
        return reply.send({ success: true, data: await WhatsappService.conectar(req.user.tenantId) })
    },

    async desconectar(req, reply) {
        return reply.send({ success: true, data: await WhatsappService.desconectar(req.user.tenantId), message: 'WhatsApp desconectado' })
    },

    async salvarRegra(req, reply) {
        return reply.send({ success: true, data: await WhatsappService.salvarRegra(req.user.tenantId, req.body), message: 'Envio automático salvo' })
    },

    async enviarTeste(req, reply) {
        return reply.send({ success: true, data: await WhatsappService.enviarTeste(req.user.tenantId, req.body?.telefone), message: 'Mensagem de teste enviada' })
    },
}
