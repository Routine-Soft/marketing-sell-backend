import { IcpService } from './icp.service.js'

export const IcpController = {
    async listar(req, reply) {
        const dados = await IcpService.listar(req.user.tenantId)
        return reply.send({ success: true, data: dados })
    },

    async criarIcp(req, reply) {
        const icp = await IcpService.criarIcp(req.user.tenantId, req.body)
        return reply.code(201).send({ success: true, data: icp, message: 'ICP adicionado' })
    },

    async editarIcp(req, reply) {
        const icp = await IcpService.editarIcp(req.user.tenantId, req.params.id, req.body)
        return reply.send({ success: true, data: icp, message: 'ICP atualizado' })
    },

    async excluirIcp(req, reply) {
        await IcpService.excluirIcp(req.user.tenantId, req.params.id)
        return reply.send({ success: true, message: 'ICP excluído' })
    },

    async criarPersona(req, reply) {
        const persona = await IcpService.criarPersona(req.user.tenantId, req.body)
        return reply.code(201).send({ success: true, data: persona, message: 'Persona adicionada' })
    },

    async editarPersona(req, reply) {
        const persona = await IcpService.editarPersona(req.user.tenantId, req.params.id, req.body)
        return reply.send({ success: true, data: persona, message: 'Persona atualizada' })
    },

    async excluirPersona(req, reply) {
        await IcpService.excluirPersona(req.user.tenantId, req.params.id)
        return reply.send({ success: true, message: 'Persona excluída' })
    },
}
