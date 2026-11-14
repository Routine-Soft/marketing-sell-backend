import { ComunidadeController } from './comunidade.controller.js'
import { authenticate, authorize } from '../shared/middlewares/auth.middleware.js'

export async function comunidadeRoutes(fastify) {
    fastify.addHook('preHandler', authenticate)
    const daConta = { preHandler: authorize(['admin', 'membro', 'super_admin']) }

    fastify.get('/comunidades', daConta, ComunidadeController.listar)
    fastify.post('/comunidades', daConta, ComunidadeController.criar)
    fastify.patch('/comunidades/:id', daConta, ComunidadeController.editar)
    fastify.delete('/comunidades/:id', daConta, ComunidadeController.excluir)
}
