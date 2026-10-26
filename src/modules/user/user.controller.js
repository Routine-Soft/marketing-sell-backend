import { UserService } from './user.service.js'
import { ContaAdminService } from './conta-admin.service.js'

export const UserController = {
    async createUser(req, reply) {
        const sessao = await UserService.createUser(req.body)
        return reply.code(201).send({ success: true, data: sessao, message: 'Conta criada com sucesso' })
    },

    async loginUser(req, reply) {
        const sessao = await UserService.loginUser(req.body)
        return reply.send({ success: true, data: sessao, message: 'Login realizado com sucesso' })
    },

    async refreshToken(req, reply) {
        const result = await UserService.refresh(req.body?.refreshToken)
        return reply.send({ success: true, data: result })
    },

    async logoutUser(req, reply) {
        await UserService.logoutUser(req.user.id)
        return reply.send({ success: true, data: null })
    },

    async getMe(req, reply) {
        const user = await UserService.findMe(req.user.id)
        return reply.send({ success: true, data: user })
    },

    async updateMe(req, reply) {
        const { id, tenantId, role } = req.user
        const user = await UserService.updateMe(id, tenantId, role, req.body)
        return reply.send({ success: true, data: user, message: 'Dados atualizados com sucesso' })
    },

    async updateMyPassword(req, reply) {
        await UserService.updateMyPassword(req.user.id, req.body)
        return reply.send({ success: true, data: null, message: 'Senha alterada com sucesso' })
    },

    async listarContas(req, reply) {
        const resultado = await ContaAdminService.listar()
        return reply.send({ success: true, data: resultado })
    },

    async definirCota(req, reply) {
        const conta = await ContaAdminService.definirCota(req.params.id, req.body?.cota)
        return reply.send({ success: true, data: conta, message: 'Cota atualizada' })
    },

    async apagarConta(req, reply) {
        await ContaAdminService.apagar(req.params.id)
        return reply.send({ success: true, data: null, message: 'Conta excluída' })
    },
}
