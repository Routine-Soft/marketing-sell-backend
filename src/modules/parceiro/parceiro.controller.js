import { ParceiroService } from './parceiro.service.js'

export const ParceiroController = {
    async listar(req, reply) {
        const itens = await ParceiroService.listar(req.user.tenantId)
        return reply.send({ success: true, data: itens })
    },

    async criar(req, reply) {
        const item = await ParceiroService.criar(req.user.tenantId, req.body)
        return reply.code(201).send({ success: true, data: item, message: 'Parceiro adicionado' })
    },

    async editar(req, reply) {
        const item = await ParceiroService.editar(req.user.tenantId, req.params.id, req.body)
        return reply.send({ success: true, data: item, message: 'Parceiro atualizado' })
    },

    async excluir(req, reply) {
        await ParceiroService.excluir(req.user.tenantId, req.params.id)
        return reply.send({ success: true, message: 'Parceiro excluído' })
    },
}
