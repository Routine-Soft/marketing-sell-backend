import { IdeiaController } from './ideia.controller.js'
import { authenticate, authorize } from '../shared/middlewares/auth.middleware.js'

export async function ideiaRoutes(fastify) {
    fastify.addHook('preHandler', authenticate)
    const daConta = { preHandler: authorize(['admin', 'membro', 'super_admin']) }

    fastify.get('/ideias', daConta, IdeiaController.listar)
    fastify.post('/ideias', daConta, IdeiaController.criar)
    fastify.patch('/ideias/:id', daConta, IdeiaController.editar)
    fastify.delete('/ideias/:id', daConta, IdeiaController.excluir)
}
