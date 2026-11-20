import mongoose from 'mongoose'
import { CAMPOS_DO_ICP } from './icp.model.js'
import { CAMPOS_DA_PERSONA } from './persona.model.js'
import { texto } from '../shared/utils/campos.js'
import AppError from '../../errors/AppError.js'

// Tamanho máximo de cada campo: nome curto, anotações longas, o resto em um ou dois parágrafos.
const maximo = (campo) => ({ nome: 120, anotacoes: 20000 })[campo] ?? 3000

// Só os campos enviados entram (a tela salva o formulário inteiro, mas outro cliente pode mandar só um).
function camposDTO(body, lista, criando) {
    const dto = {}
    lista.filter((campo) => campo in body).forEach((campo) => { dto[campo] = texto(body[campo], maximo(campo)) })
    if ((criando || 'nome' in dto) && !dto.nome) throw new AppError('Dê um nome', 400)
    return dto
}

export function icpDTO(body = {}, { criando = false } = {}) {
    return camposDTO(body, CAMPOS_DO_ICP, criando)
}

export function personaDTO(body = {}, { criando = false } = {}) {
    const dto = camposDTO(body, CAMPOS_DA_PERSONA, criando)
    if (criando || 'icpId' in body) {
        if (!mongoose.isValidObjectId(body.icpId)) throw new AppError('Escolha o ICP da persona', 400)
        dto.icpId = body.icpId
    }
    return dto
}
