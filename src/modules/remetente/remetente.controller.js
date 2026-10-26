import { RemetenteService } from './remetente.service.js'

export const RemetenteController = {
    async listar(req, reply) {
        const remetentes = await RemetenteService.listar(req.user.tenantId)
        return reply.send({ success: true, data: remetentes })
    },

    async cotas(req, reply) {
        const cotas = await RemetenteService.cotas(req.user.tenantId)
        return reply.send({ success: true, data: cotas })
    },

    async criar(req, reply) {
        const remetente = await RemetenteService.criar(req.user.tenantId, req.body)
        return reply.code(201).send({ success: true, data: remetente, message: 'Remetente criado com sucesso' })
    },

    async editar(req, reply) {
        const remetente = await RemetenteService.editar(req.user.tenantId, req.params.id, req.body)
        return reply.send({ success: true, data: remetente, message: 'Remetente atualizado com sucesso' })
    },

    async excluir(req, reply) {
        await RemetenteService.excluir(req.user.tenantId, req.params.id)
        return reply.send({ success: true, message: 'Remetente excluído com sucesso' })
    },

    async enviarTeste(req, reply) {
        const destino = await RemetenteService.enviarTeste(req.user.tenantId, req.params.id, req.body?.para)
        return reply.send({ success: true, message: `E-mail de teste enviado para ${destino}` })
    },
}
