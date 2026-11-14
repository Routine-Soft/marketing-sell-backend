import mongoose from 'mongoose'
import LeadModel from './lead.model.js'
import { EmailSiteService } from '../email-site/email-site.service.js'
import { SEM_RESPOSTA } from './lead.model.js'
import { registrarContato, pararFollowUp, proximoFollowUp } from './lead.contato.js'
import { RotinaService } from '../rotina/rotina.service.js'
import { filtroLeadsDTO, paginacaoDTO, createLeadDTO, updateLeadDTO, contatoDTO, idsDTO } from './lead.dto.js'
import { leadsParaCsv } from './lead.csv.js'
import AppError from '../../errors/AppError.js'

const LIMITE_EXPORTACAO = 20000

export const LeadService = {
    async listar(tenantId, query) {
        const filtro = filtroLeadsDTO(tenantId, query)
        const { pagina, porPagina } = paginacaoDTO(query)
        const [itens, total] = await Promise.all([
            LeadModel.find(filtro).sort(query.followUp ? { proximoFollowUpEm: 1, _id: 1 } : { createdAt: -1, _id: -1 }).skip((pagina - 1) * porPagina).limit(porPagina),
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

    // Lead cadastrado à mão. Já contatado no cadastro? Conta como primeiro contato.
    async criar(tenantId, body) {
        const { status, ...dados } = createLeadDTO(body)
        const lead = await LeadModel.create({ ...dados, tenantId })
        return status === 'novo' ? lead : this.atualizar(tenantId, lead._id, { status })
    },

    // Mudar a situação mexe no follow-up: "contatado" pela primeira vez conta como contato; quem respondeu
    // (ou avançou, ou foi descartado) sai do follow-up e dos e-mails automáticos que ainda estavam na fila.
    async atualizar(tenantId, id, body) {
        const dados = updateLeadDTO(body)
        const lead = await LeadModel.findOne({ _id: id, tenantId })
        if (!lead) throw new AppError('Lead não encontrado', 404)
        const situacaoAntes = lead.status
        lead.set(dados)
        if (dados.status && dados.status !== situacaoAntes) {
            if (dados.status === 'contatado' && !lead.numeroContatos) {
                lead.status = 'novo'
                await registrarContato(lead, 'ligacao')
            } else if (!SEM_RESPOSTA.includes(dados.status)) {
                await pararFollowUp(lead)
            } else if (lead.primeiroContatoEm) {
                // Voltou para "sem resposta": o follow-up continua de onde parou.
                lead.proximoFollowUpEm = proximoFollowUp(lead.primeiroContatoEm, lead.numeroContatos)
            }
        }
        await lead.save()
        await RotinaService.sincronizarHoje(tenantId)
        return lead
    },

    async registrarContato(tenantId, id, body) {
        const { canal } = contatoDTO(body)
        const lead = await LeadModel.findOne({ _id: id, tenantId })
        if (!lead) throw new AppError('Lead não encontrado', 404)
        await registrarContato(lead, canal)
        await RotinaService.sincronizarHoje(tenantId)
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
