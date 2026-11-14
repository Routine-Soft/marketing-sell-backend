import { RotinaService } from './rotina.service.js'

export const RotinaController = {
    async grade(req, reply) {
        const rotina = await RotinaService.grade(req.user.tenantId, req.query)
        return reply.send({ success: true, data: rotina })
    },

    async marcar(req, reply) {
        const rotina = await RotinaService.marcar(req.user.tenantId, req.params.dia, req.body)
        return reply.send({ success: true, data: rotina })
    },

    async painel(req, reply) {
        const painel = await RotinaService.painel(req.user.tenantId)
        return reply.send({ success: true, data: painel })
    },
}
