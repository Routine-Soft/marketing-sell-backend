import { LeadService } from './lead.service.js'
import { idiomaDaRequisicao } from '../shared/utils/idioma.js'

export const LeadController = {
    async listar(req, reply) {
        const resultado = await LeadService.listar(req.user.tenantId, req.query)
        return reply.send({ success: true, data: resultado })
    },

    async resumo(req, reply) {
        const resumo = await LeadService.resumo(req.user.tenantId)
        return reply.send({ success: true, data: resumo })
    },

    // A planilha vai dentro do JSON: o site baixa com o mesmo httpClient (que manda o token).
    async exportar(req, reply) {
        const csv = await LeadService.exportar(req.user.tenantId, req.query, idiomaDaRequisicao(req))
        const nomeArquivo = `leads-${new Date().toISOString().slice(0, 10)}.csv`
        return reply.send({ success: true, data: { csv, nomeArquivo } })
    },

    async atualizar(req, reply) {
        const lead = await LeadService.atualizar(req.user.tenantId, req.params.id, req.body)
        return reply.send({ success: true, data: lead, message: 'Lead atualizado' })
    },

    async excluir(req, reply) {
        await LeadService.excluir(req.user.tenantId, req.params.id)
        return reply.send({ success: true, data: null, message: 'Lead excluído' })
    },

    async excluirVarios(req, reply) {
        const total = await LeadService.excluirVarios(req.user.tenantId, req.body)
        return reply.send({ success: true, data: { total }, message: `${total} leads excluídos` })
    },

    async buscarEmails(req, reply) {
        const total = await LeadService.buscarEmails(req.user.tenantId, req.body)
        return reply.send({
            success: true,
            data: { total },
            message: total ? `${total} sites na fila de busca de e-mail` : 'Nenhum dos leads selecionados tem site para procurar e-mail',
        })
    },
}
