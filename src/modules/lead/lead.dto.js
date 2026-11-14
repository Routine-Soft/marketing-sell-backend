import mongoose from 'mongoose'
import { LEAD_STATUS } from './lead.model.js'
import { CANAIS_CONTATO } from './contato.model.js'
import { filtroFollowUp } from './lead.contato.js'
import { diaDe, fimDoDia } from '../shared/utils/dia.js'
import { FONTES } from '../captacao/fontes/index.js'
import AppError from '../../errors/AppError.js'
import { texto } from '../shared/utils/campos.js'
import { GMAIL_YAHOO_RE } from '../shared/utils/provedor-email.js'

function escaparRegex(texto) {
    return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Filtros da lista e da exportação, sempre dentro da conta (tenantId).
export function filtroLeadsDTO(tenantId, query = {}) {
    const filtro = { tenantId }
    const busca = String(query.busca ?? '').trim()
    if (busca) {
        const regex = new RegExp(escaparRegex(busca), 'i')
        filtro.$or = [{ nome: regex }, { contato: regex }, { email: regex }, { telefone: regex }, { cidade: regex }, { categoria: regex }, { instagram: regex }]
    }
    if (FONTES[query.fonte] || query.fonte === 'manual') filtro.fonte = query.fonte
    if (LEAD_STATUS.includes(query.status)) filtro.status = query.status
    if (/^[A-Za-z]{2}$/.test(query.estado ?? '')) filtro.estado = query.estado.toUpperCase()
    if (query.comEmail === 'sim') filtro.email = { $ne: '' }
    if (query.comEmail === 'nao') filtro.email = ''
    if (query.comEmail === 'gmail_yahoo') filtro.email = GMAIL_YAHOO_RE
    if (query.comTelefone === 'sim') filtro.telefone = { $ne: '' }
    if (mongoose.isValidObjectId(query.buscaId)) filtro.buscaId = query.buscaId
    // followUp=vencido (até hoje) ou encerrar (4 contatos sem resposta): manda na situação e nas datas.
    Object.assign(filtro, filtroFollowUp(query.followUp, fimDoDia(diaDe())))
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
    if ('nome' in body) {
        dto.nome = texto(body.nome, 200)
        if (!dto.nome) throw new AppError('Informe o nome', 400)
    }
    if ('categoria' in body) dto.categoria = texto(body.categoria, 120)
    if ('cidade' in body) dto.cidade = texto(body.cidade, 120)
    if ('estado' in body) dto.estado = texto(body.estado, 2).toUpperCase()
    if ('instagram' in body) dto.instagram = texto(body.instagram, 120)
    if ('origem' in body) dto.origem = texto(body.origem, 80)
    if ('observacao' in body) dto.observacao = texto(body.observacao, 2000)
    if ('telefone' in body) dto.telefone = texto(body.telefone, 40)
    if ('email' in body) {
        dto.email = String(body.email ?? '').replace(/\s+/g, '').toLowerCase()
        if (dto.email && !/^[^@]+@[^@]+\.[a-z]{2,}$/.test(dto.email)) throw new AppError('Informe um e-mail válido', 400)
        dto.emailStatus = dto.email ? 'encontrado' : 'nao_buscado'
    }
    return dto
}

// Lead cadastrado à mão (linha nova na aba Leads): o nome é obrigatório, o resto é opcional.
export function createLeadDTO(body = {}) {
    return { status: 'novo', ...updateLeadDTO({ ...body, nome: body.nome }), fonte: 'manual', idExterno: String(new mongoose.Types.ObjectId()) }
}

export function contatoDTO(body = {}) {
    if (!CANAIS_CONTATO.includes(body.canal)) throw new AppError('Escolha por onde foi o contato', 400)
    return { canal: body.canal }
}

export function idsDTO(body = {}) {
    const ids = Array.isArray(body.ids) ? body.ids.filter((id) => mongoose.isValidObjectId(id)) : []
    if (!ids.length) throw new AppError('Selecione pelo menos um lead', 400)
    return ids.slice(0, 1000)
}
