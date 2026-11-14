import { ParceiroController } from './parceiro.controller.js'
import { authenticate, authorize } from '../shared/middlewares/auth.middleware.js'

export async function parceiroRoutes(fastify) {
    fastify.addHook('preHandler', authenticate)
    const daConta = { preHandler: authorize(['admin', 'membro', 'super_admin']) }

    fastify.get('/parceiros', daConta, ParceiroController.listar)
    fastify.post('/parceiros', daConta, ParceiroController.criar)
    fastify.patch('/parceiros/:id', daConta, ParceiroController.editar)
    fastify.delete('/parceiros/:id', daConta, ParceiroController.excluir)
}
