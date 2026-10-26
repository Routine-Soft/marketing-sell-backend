import "dotenv/config";
import Fastify from "fastify";
import fastifyCors from '@fastify/cors'
import db from './src/db/db.js'
import { idiomaDaRequisicao, traduzirMensagem } from './src/modules/shared/utils/idioma.js'
import { userRoutes } from "./src/modules/user/user.routes.js";
import { captacaoRoutes } from "./src/modules/captacao/captacao.routes.js";
import { leadRoutes } from "./src/modules/lead/lead.routes.js";
import { remetenteRoutes } from "./src/modules/remetente/remetente.routes.js";
import { envioRoutes } from "./src/modules/envio/envio.routes.js";
import { iniciarFilaDeEnvios } from "./src/modules/envio/envio.fila.js";
import { iniciarFilaDeEmails } from "./src/modules/email-site/email-site.fila.js";

const fastify = Fastify({ logger: true })

await fastify.register(fastifyCors, {
  origin: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
})

// Avisos e erros no idioma do site (Accept-Language): troca o campo "message" das respostas em JSON.
fastify.addHook('onSend', async (req, reply, payload) => {
  if (idiomaDaRequisicao(req) !== 'en' || typeof payload !== 'string' || !payload.includes('"message"')) return payload
  if (!String(reply.getHeader('content-type') ?? '').includes('application/json')) return payload
  try {
    const corpo = JSON.parse(payload)
    if (typeof corpo?.message !== 'string') return payload
    corpo.message = traduzirMensagem(corpo.message, 'en')
    return JSON.stringify(corpo)
  } catch {
    return payload
  }
})

fastify.setErrorHandler((error, request, reply) => {
  // Id inválido na URL (ex.: /leads/abc): para quem chamou, é um registro que não existe.
  if (error.name === 'CastError') {
    return reply.status(404).send({ success: false, message: 'Registro não encontrado' })
  }
  const status = error.statusCode || 500
  if (status >= 500) fastify.log.error(error)

  return reply.status(status).send({
    success: false,
    message: status >= 500 && !error.statusCode ? 'Erro interno do servidor' : error.message,
    ...(error.codigo ? { code: error.codigo } : {})
  })
})

await fastify.register(userRoutes, { prefix: '/api' })
await fastify.register(captacaoRoutes, { prefix: '/api' })
await fastify.register(leadRoutes, { prefix: '/api' })
await fastify.register(remetenteRoutes, { prefix: '/api' })
await fastify.register(envioRoutes, { prefix: '/api' })

const start = async () => {
  try {
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET não definido no .env')
    await db()

    await fastify.listen({ port: process.env.PORT || 8080, host: '0.0.0.0' })
    iniciarFilaDeEmails(fastify.log)
    iniciarFilaDeEnvios(fastify.log)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
