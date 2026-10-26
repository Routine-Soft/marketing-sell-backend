import mongoose from 'mongoose'
import { LEAD_STATUS } from './lead.model.js'
import { FONTES } from '../captacao/fontes/index.js'
import AppError from '../../errors/AppError.js'

function escaparRegex(texto) {
    return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Filtros da lista e da exportação, sempre dentro da conta (tenantId).
export function filtroLeadsDTO(tenantId, query = {}) {
    const filtro = { tenantId }
    const busca = String(query.busca ?? '').trim()
    if (busca) {
        const regex = new RegExp(escaparRegex(busca), 'i')
        filtro.$or = [{ nome: regex }, { contato: regex }, { email: regex }, { telefone: regex }, { cidade: regex }, { categoria: regex }]
    }
    if (FONTES[query.fonte]) filtro.fonte = query.fonte
    if (LEAD_STATUS.includes(query.status)) filtro.status = query.status
    if (/^[A-Za-z]{2}$/.test(query.estado ?? '')) filtro.estado = query.estado.toUpperCase()
    if (query.comEmail === 'sim') filtro.email = { $ne: '' }
    if (query.comEmail === 'nao') filtro.email = ''
    if (query.comTelefone === 'sim') filtro.telefone = { $ne: '' }
    if (mongoose.isValidObjectId(query.buscaId)) filtro.buscaId = query.buscaId
    return filtro
}

export function paginacaoDTO(query = {}) {
    const pagina = Math.max(1, Number.parseInt(query.pagina, 10) || 1)
    const porPagina = Math.min(100, Math.max(1, Number.parseInt(query.porPagina, 10) || 25))
    return { pagina, porPagina }
}

export function updateLeadDTO(body = {}) {
    const dto = {}
    if ('status' in body) {
        if (!LEAD_STATUS.includes(body.status)) throw new AppError('Situação inválida', 400)
        dto.status = body.status
    }
    if ('observacao' in body) dto.observacao = String(body.observacao ?? '').trim().slice(0, 2000)
    if ('telefone' in body) dto.telefone = String(body.telefone ?? '').trim()
    if ('email' in body) {
        dto.email = String(body.email ?? '').replace(/\s+/g, '').toLowerCase()
        if (dto.email && !/^[^@]+@[^@]+\.[a-z]{2,}$/.test(dto.email)) throw new AppError('Informe um e-mail válido', 400)
        dto.emailStatus = dto.email ? 'encontrado' : 'nao_buscado'
    }
    return dto
}

export function idsDTO(body = {}) {
    const ids = Array.isArray(body.ids) ? body.ids.filter((id) => mongoose.isValidObjectId(id)) : []
    if (!ids.length) throw new AppError('Selecione pelo menos um lead', 400)
    return ids.slice(0, 1000)
}
