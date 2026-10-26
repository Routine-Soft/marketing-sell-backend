import { EnvioService } from './envio.service.js'

export const EnvioController = {
    async previa(req, reply) {
        const previa = await EnvioService.previa(req.user.tenantId, req.body)
        return reply.send({ success: true, data: previa })
    },

    async enfileirar(req, reply) {
        const total = await EnvioService.enfileirar(req.user.tenantId, req.body)
        return reply.code(201).send({
            success: true,
            data: { total },
            message: total === 1 ? '1 e-mail na fila de envio' : `${total} e-mails na fila de envio`,
        })
    },

    async cancelarFila(req, reply) {
        const total = await EnvioService.cancelarFila(req.user.tenantId, req.body?.email)
        return reply.send({
            success: true,
            data: { total },
            message: total === 1 ? '1 e-mail tirado da fila' : `${total} e-mails tirados da fila`,
        })
    },
}
