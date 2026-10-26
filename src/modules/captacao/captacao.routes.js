import { CaptacaoController } from './captacao.controller.js'
import { authenticate, authorize } from '../shared/middlewares/auth.middleware.js'

export async function captacaoRoutes(fastify) {
    fastify.addHook('preHandler', authenticate)
    const daConta = { preHandler: authorize(['admin', 'membro', 'super_admin']) }

    fastify.get('/captacao/opcoes', daConta, CaptacaoController.opcoes)
    fastify.get('/captacao/buscas', daConta, CaptacaoController.historico)
    fastify.post('/captacao/buscas', daConta, CaptacaoController.buscar)
}
