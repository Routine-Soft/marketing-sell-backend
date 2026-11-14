import { NegocioController } from './negocio.controller.js'
import { authenticate, authorize } from '../shared/middlewares/auth.middleware.js'

export async function negocioRoutes(fastify) {
    fastify.addHook('preHandler', authenticate)
    const daConta = { preHandler: authorize(['admin', 'membro', 'super_admin']) }
    // Criar, mudar e excluir negócios, a rotina e os modelos: só quem administra a conta.
    const doDono = { preHandler: authorize(['admin', 'super_admin']) }

    fastify.get('/negocios', daConta, NegocioController.listar)
    fastify.get('/negocios/atual', daConta, NegocioController.atual)
    fastify.post('/negocios', doDono, NegocioController.criar)
    fastify.patch('/negocios/:id', doDono, NegocioController.editar)
    fastify.delete('/negocios/:id', doDono, NegocioController.excluir)
    fastify.post('/negocios/:id/entrar', daConta, NegocioController.entrar)
    fastify.put('/negocios/atual/rotina', doDono, NegocioController.salvarRotina)
    fastify.post('/negocios/atual/modelo', doDono, NegocioController.aplicarModelo)

    fastify.get('/modelos', daConta, NegocioController.modelos)
    fastify.post('/modelos', doDono, NegocioController.salvarComoModelo)
    fastify.delete('/modelos/:id', doDono, NegocioController.excluirModelo)
}
