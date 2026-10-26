import { EnvioController } from './envio.controller.js'
import { authenticate, authorize } from '../shared/middlewares/auth.middleware.js'

export async function envioRoutes(fastify) {
    fastify.addHook('preHandler', authenticate)
    // Usa o Gmail configurado nos remetentes: só quem administra a conta.
    const daConta = { preHandler: authorize(['admin', 'super_admin']) }

    fastify.post('/envios/previa', daConta, EnvioController.previa)
    fastify.post('/envios', daConta, EnvioController.enfileirar)
    fastify.post('/envios/cancelar', daConta, EnvioController.cancelarFila)
}
