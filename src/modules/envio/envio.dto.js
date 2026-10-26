import mongoose from 'mongoose'
import AppError from '../../errors/AppError.js'
import { idsDTO } from '../lead/lead.dto.js'

function remetenteIdDTO(body) {
    if (!mongoose.isValidObjectId(body?.remetenteId)) throw new AppError('Escolha o remetente', 400)
    return body.remetenteId
}

export function previaDTO(body) {
    return { remetenteId: remetenteIdDTO(body), ids: idsDTO(body) }
}

export function enviarDTO(body) {
    const assunto = String(body?.assunto ?? '').trim()
    const corpo = String(body?.corpo ?? '')
    if (!assunto) throw new AppError('Informe o assunto do e-mail', 400)
    if (!corpo.trim()) throw new AppError('Escreva o texto do e-mail', 400)
    return { ...previaDTO(body), assunto, corpo, reenviar: body?.reenviar === true }
}
