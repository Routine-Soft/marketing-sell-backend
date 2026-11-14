import { CaptacaoService } from './captacao.service.js'

export const CaptacaoController = {
    async opcoes(req, reply) {
        const opcoes = await CaptacaoService.opcoes(req.user.contaId)
        return reply.send({ success: true, data: opcoes })
    },

    async buscar(req, reply) {
        const { tenantId, contaId, id } = req.user
        const resultado = await CaptacaoService.buscar(tenantId, contaId, id, req.body)
        const { encontrados, novos } = resultado.busca
        return reply.code(201).send({ success: true, data: resultado, message: `Busca concluída: ${encontrados} encontrados, ${novos} novos` })
    },
}
