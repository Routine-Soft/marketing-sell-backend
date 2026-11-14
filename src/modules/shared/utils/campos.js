import AppError from '../../../errors/AppError.js'
import { diaValido, inicioDoDia } from './dia.js'

export function texto(valor, maximo = 300) {
    return String(valor ?? '').trim().slice(0, maximo)
}

// Data vinda da tela como 'AAAA-MM-DD' (dia de Brasília); vazio = sem data.
export function dataDoDia(valor) {
    if (!valor) return null
    const dia = String(valor).slice(0, 10)
    if (!diaValido(dia)) throw new AppError('Data inválida', 400)
    return inicioDoDia(dia)
}

export function umDe(valor, opcoes, mensagem) {
    if (!opcoes.includes(valor)) throw new AppError(mensagem, 400)
    return valor
}
