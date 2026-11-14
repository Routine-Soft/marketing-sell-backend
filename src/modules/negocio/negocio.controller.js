import { NegocioService } from './negocio.service.js'
import { UserService } from '../user/user.service.js'

export const NegocioController = {
    async listar(req, reply) {
        const dados = await NegocioService.listar(req.user.contaId, req.user.tenantId)
        return reply.send({ success: true, data: dados })
    },

    async atual(req, reply) {
        const negocio = await NegocioService.atual(req.user.contaId, req.user.tenantId)
        return reply.send({ success: true, data: negocio })
    },

    async criar(req, reply) {
        const negocio = await NegocioService.criar(req.user.contaId, req.body)
        return reply.code(201).send({ success: true, data: negocio, message: 'Negócio criado' })
    },

    async editar(req, reply) {
        const negocio = await NegocioService.editar(req.user.contaId, req.params.id, req.body)
        return reply.send({ success: true, data: negocio, message: 'Negócio atualizado' })
    },

    async excluir(req, reply) {
        await NegocioService.excluir(req.user.contaId, req.params.id, req.user.tenantId)
        return reply.send({ success: true, message: 'Negócio excluído' })
    },

    async entrar(req, reply) {
        const sessao = await NegocioService.entrar(req.user.id, req.user.contaId, req.params.id, UserService.emitirSessao)
        return reply.send({ success: true, data: sessao })
    },

    async salvarRotina(req, reply) {
        const rotina = await NegocioService.salvarRotina(req.user.contaId, req.user.tenantId, req.body)
        return reply.send({ success: true, data: rotina, message: 'Rotina salva' })
    },

    async modelos(req, reply) {
        const modelos = await NegocioService.modelos(req.user.contaId)
        return reply.send({ success: true, data: modelos })
    },

    async salvarComoModelo(req, reply) {
        const modelo = await NegocioService.salvarComoModelo(req.user.contaId, req.user.tenantId, req.body)
        return reply.code(201).send({ success: true, data: modelo, message: 'Modelo salvo' })
    },

    async excluirModelo(req, reply) {
        await NegocioService.excluirModelo(req.user.contaId, req.params.id)
        return reply.send({ success: true, message: 'Modelo excluído' })
    },

    async aplicarModelo(req, reply) {
        const negocio = await NegocioService.aplicarModelo(req.user.contaId, req.user.tenantId, req.body?.modeloId)
        return reply.send({ success: true, data: negocio, message: 'Modelo aplicado' })
    },
}
