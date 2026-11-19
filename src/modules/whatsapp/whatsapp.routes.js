import { WhatsappController } from './whatsapp.controller.js'
import { authenticate, authorize } from '../shared/middlewares/auth.middleware.js'

// WhatsApp do negócio aberto e o envio automático para os leads. Só quem administra a conta configura.
export async function whatsappRoutes(fastify) {
    fastify.addHook('preHandler', authenticate)
    fastify.addHook('preHandler', authorize(['admin', 'super_admin']))

    fastify.get('/whatsapp', WhatsappController.situacao)
    fastify.post('/whatsapp/conectar', WhatsappController.conectar)
    fastify.post('/whatsapp/desconectar', WhatsappController.desconectar)
    fastify.patch('/whatsapp', WhatsappController.salvarRegra)
    fastify.post('/whatsapp/teste', WhatsappController.enviarTeste)
}
