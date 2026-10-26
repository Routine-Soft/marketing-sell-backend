import { LeadController } from './lead.controller.js'
import { authenticate, authorize } from '../shared/middlewares/auth.middleware.js'

export async function leadRoutes(fastify) {
    fastify.addHook('preHandler', authenticate)
    const daConta = { preHandler: authorize(['admin', 'membro', 'super_admin']) }

    fastify.get('/leads', daConta, LeadController.listar)
    fastify.get('/leads/resumo', daConta, LeadController.resumo)
    fastify.get('/leads/exportar', daConta, LeadController.exportar)
    fastify.post('/leads/emails', daConta, LeadController.buscarEmails)
    fastify.post('/leads/excluir', daConta, LeadController.excluirVarios)
    fastify.patch('/leads/:id', daConta, LeadController.atualizar)
    fastify.delete('/leads/:id', daConta, LeadController.excluir)
}
