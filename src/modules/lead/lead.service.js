import mongoose from 'mongoose'
import LeadModel from './lead.model.js'
import { EmailSiteService } from '../email-site/email-site.service.js'
import { filtroLeadsDTO, paginacaoDTO, updateLeadDTO, idsDTO } from './lead.dto.js'
import { leadsParaCsv } from './lead.csv.js'
import AppError from '../../errors/AppError.js'

const LIMITE_EXPORTACAO = 20000

export const LeadService = {
    async listar(tenantId, query) {
        const filtro = filtroLeadsDTO(tenantId, query)
        const { pagina, porPagina } = paginacaoDTO(query)
        const [itens, total] = await Promise.all([
            LeadModel.find(filtro).sort({ createdAt: -1, _id: -1 }).skip((pagina - 1) * porPagina).limit(porPagina),
            LeadModel.countDocuments(filtro),
        ])
        return { itens, total, pagina, porPagina }
    },

    async resumo(tenantId) {
        const [linha] = await LeadModel.aggregate([
            // No aggregate o Mongoose não converte o id do token (texto) para ObjectId.
            { $match: { tenantId: new mongoose.Types.ObjectId(String(tenantId)) } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    comEmail: { $sum: { $cond: [{ $ne: ['$email', ''] }, 1, 0] } },
                    comTelefone: { $sum: { $cond: [{ $ne: ['$telefone', ''] }, 1, 0] } },
                    naFila: { $sum: { $cond: [{ $in: ['$emailStatus', ['na_fila', 'buscando']] }, 1, 0] } },
                },
            },
        ])
        return { total: 0, comEmail: 0, comTelefone: 0, naFila: 0, ...linha, _id: undefined }
    },

    async exportar(tenantId, query, idioma) {
        const leads = await LeadModel.find(filtroLeadsDTO(tenantId, query)).sort({ createdAt: -1 }).limit(LIMITE_EXPORTACAO).lean()
        return leadsParaCsv(leads, idioma)
    },

    async atualizar(tenantId, id, body) {
        const lead = await LeadModel.findOneAndUpdate({ _id: id, tenantId }, { $set: updateLeadDTO(body) }, { new: true, runValidators: true })
        if (!lead) throw new AppError('Lead não encontrado', 404)
        return lead
    },

    async excluir(tenantId, id) {
        const lead = await LeadModel.findOneAndDelete({ _id: id, tenantId })
        if (!lead) throw new AppError('Lead não encontrado', 404)
        return null
    },

    async excluirVarios(tenantId, body) {
        const resultado = await LeadModel.deleteMany({ _id: { $in: idsDTO(body) }, tenantId })
        return resultado.deletedCount
    },

    async buscarEmails(tenantId, body) {
        return await EmailSiteService.enfileirar(tenantId, { ids: idsDTO(body) })
    },
}
