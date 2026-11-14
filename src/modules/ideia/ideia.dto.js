import { STATUS_DE_IDEIA, TIPOS_DE_IDEIA } from './ideia.model.js'
import { texto, umDe } from '../shared/utils/campos.js'
import { diaValido } from '../shared/utils/dia.js'
import AppError from '../../errors/AppError.js'

export function tipoDTO(tipo) {
    return umDe(tipo, TIPOS_DE_IDEIA, 'Tipo inválido')
}

function diaDTO(valor) {
    const dia = String(valor ?? '').slice(0, 10)
    if (dia && !diaValido(dia)) throw new AppError('Data inválida', 400)
    return dia
}

// Período da tela (uma semana); sem período, só as ideias sem data.
export function periodoDTO(query = {}) {
    const de = diaDTO(query.de)
    const ate = diaDTO(query.ate)
    if (!de || !ate || ate < de) throw new AppError('Período inválido', 400)
    return { de, ate }
}

// Só os campos enviados entram. Ideia precisa de pelo menos título, roteiro ou legenda.
export function ideiaDTO(body = {}, { criando = false } = {}) {
    const dto = {}
    if (criando) dto.tipo = tipoDTO(body.tipo)
    if ('dia' in body) dto.dia = diaDTO(body.dia)
    if ('titulo' in body) dto.titulo = texto(body.titulo, 200)
    if ('roteiro' in body) dto.roteiro = texto(body.roteiro, 20000)
    if ('legenda' in body) dto.legenda = texto(body.legenda, 5000)
    if ('status' in body) dto.status = umDe(body.status, STATUS_DE_IDEIA, 'Situação inválida')
    if (criando && !dto.titulo && !dto.roteiro && !dto.legenda) throw new AppError('Escreva o título, o roteiro ou a legenda', 400)
    return dto
}
