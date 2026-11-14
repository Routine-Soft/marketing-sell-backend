import { ChecklistService } from './checklist.service.js'

export const ChecklistController = {
    async listar(req, reply) {
        const itens = await ChecklistService.listar(req.user.tenantId, req.params.lista)
        return reply.send({ success: true, data: itens })
    },

    async criar(req, reply) {
        const item = await ChecklistService.criar(req.user.tenantId, req.params.lista, req.body)
        return reply.code(201).send({ success: true, data: item, message: 'Item adicionado' })
    },

    async editar(req, reply) {
        const item = await ChecklistService.editar(req.user.tenantId, req.params.id, req.body)
        return reply.send({ success: true, data: item, message: 'Item atualizado' })
    },

    async excluir(req, reply) {
        await ChecklistService.excluir(req.user.tenantId, req.params.id)
        return reply.send({ success: true, message: 'Item excluído' })
    },
}
