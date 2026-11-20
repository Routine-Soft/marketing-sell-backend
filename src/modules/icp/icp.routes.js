import { IcpController } from './icp.controller.js'
import { authenticate, authorize } from '../shared/middlewares/auth.middleware.js'

export async function icpRoutes(fastify) {
    fastify.addHook('preHandler', authenticate)
    const daConta = { preHandler: authorize(['admin', 'membro', 'super_admin']) }

    fastify.get('/icps', daConta, IcpController.listar)
    fastify.post('/icps', daConta, IcpController.criarIcp)
    fastify.patch('/icps/:id', daConta, IcpController.editarIcp)
    fastify.delete('/icps/:id', daConta, IcpController.excluirIcp)
    fastify.post('/personas', daConta, IcpController.criarPersona)
    fastify.patch('/personas/:id', daConta, IcpController.editarPersona)
    fastify.delete('/personas/:id', daConta, IcpController.excluirPersona)
}
