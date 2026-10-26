import { UserController } from './user.controller.js'
import { authenticate, authorize } from '../shared/middlewares/auth.middleware.js'

export async function userRoutes(fastify) {

    // rotas públicas
    fastify.post('/users', UserController.createUser)
    fastify.post('/users/login', UserController.loginUser)
    fastify.post('/users/refresh', UserController.refreshToken)

    fastify.register(async function (fastify) {
        fastify.addHook('preHandler', authenticate)

        fastify.get('/users/me', UserController.getMe)
        fastify.patch('/users/me', UserController.updateMe)
        fastify.post('/users/me/password', UserController.updateMyPassword)
        fastify.post('/users/logout', UserController.logoutUser)

        // Painel do super_admin: as contas da plataforma.
        const soSuperAdmin = { preHandler: authorize(['super_admin']) }
        fastify.get('/users/contas', soSuperAdmin, UserController.listarContas)
        fastify.patch('/users/contas/:id/cota', soSuperAdmin, UserController.definirCota)
        fastify.delete('/users/contas/:id', soSuperAdmin, UserController.apagarConta)
    })
}
