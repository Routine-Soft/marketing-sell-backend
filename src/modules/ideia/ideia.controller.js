import { IdeiaService } from './ideia.service.js'

export const IdeiaController = {
    async listar(req, reply) {
        const ideias = await IdeiaService.listar(req.user.tenantId, req.query)
        return reply.send({ success: true, data: ideias })
    },

    async criar(req, reply) {
        const ideia = await IdeiaService.criar(req.user.tenantId, req.body)
        return reply.code(201).send({ success: true, data: ideia, message: 'Ideia adicionada' })
    },

    async editar(req, reply) {
        const ideia = await IdeiaService.editar(req.user.tenantId, req.params.id, req.body)
        return reply.send({ success: true, data: ideia, message: 'Ideia atualizada' })
    },

    async excluir(req, reply) {
        await IdeiaService.excluir(req.user.tenantId, req.params.id)
        return reply.send({ success: true, message: 'Ideia excluída' })
    },
}
