import { ChecklistController } from './checklist.controller.js'
import { authenticate, authorize } from '../shared/middlewares/auth.middleware.js'

export async function checklistRoutes(fastify) {
    fastify.addHook('preHandler', authenticate)
    const daConta = { preHandler: authorize(['admin', 'membro', 'super_admin']) }

    fastify.get('/checklists/:lista', daConta, ChecklistController.listar)
    fastify.post('/checklists/:lista', daConta, ChecklistController.criar)
    fastify.patch('/checklists/itens/:id', daConta, ChecklistController.editar)
    fastify.delete('/checklists/itens/:id', daConta, ChecklistController.excluir)
}
