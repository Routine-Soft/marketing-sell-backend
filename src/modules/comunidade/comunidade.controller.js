import { ComunidadeService } from './comunidade.service.js'

export const ComunidadeController = {
    async listar(req, reply) {
        const itens = await ComunidadeService.listar(req.user.tenantId)
        return reply.send({ success: true, data: itens })
    },

    async criar(req, reply) {
        const item = await ComunidadeService.criar(req.user.tenantId, req.body)
        return reply.code(201).send({ success: true, data: item, message: 'Registro adicionado' })
    },

    async editar(req, reply) {
        const item = await ComunidadeService.editar(req.user.tenantId, req.params.id, req.body)
        return reply.send({ success: true, data: item, message: 'Registro atualizado' })
    },

    async excluir(req, reply) {
        await ComunidadeService.excluir(req.user.tenantId, req.params.id)
        return reply.send({ success: true, message: 'Registro excluído' })
    },
}
