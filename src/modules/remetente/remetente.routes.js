import { RemetenteController } from './remetente.controller.js'
import { authenticate, authorize } from '../shared/middlewares/auth.middleware.js'

export async function remetenteRoutes(fastify) {
    fastify.addHook('preHandler', authenticate)
    // Credenciais de e-mail: só quem administra a conta configura.
    const daConta = { preHandler: authorize(['admin', 'super_admin']) }

    fastify.get('/remetentes', daConta, RemetenteController.listar)
    fastify.get('/remetentes/cotas', daConta, RemetenteController.cotas)
    fastify.post('/remetentes', daConta, RemetenteController.criar)
    fastify.patch('/remetentes/:id', daConta, RemetenteController.editar)
    fastify.delete('/remetentes/:id', daConta, RemetenteController.excluir)
    fastify.post('/remetentes/:id/teste', daConta, RemetenteController.enviarTeste)
}
