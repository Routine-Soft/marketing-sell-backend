import { RotinaController } from './rotina.controller.js'
import { authenticate, authorize } from '../shared/middlewares/auth.middleware.js'

export async function rotinaRoutes(fastify) {
    fastify.addHook('preHandler', authenticate)
    const daConta = { preHandler: authorize(['admin', 'membro', 'super_admin']) }

    fastify.get('/rotina/grade', daConta, RotinaController.grade)
    fastify.get('/rotina/painel', daConta, RotinaController.painel)
    fastify.patch('/rotina/:dia', daConta, RotinaController.marcar)
}
