import { LISTAS } from './checklist.model.js'
import { texto, dataDoDia, umDe } from '../shared/utils/campos.js'
import AppError from '../../errors/AppError.js'

export function listaDTO(lista) {
    return umDe(lista, LISTAS, 'Lista não encontrada')
}

// Só os campos enviados entram (a tela salva uma célula por vez).
export function itemDTO(body = {}, { criando = false } = {}) {
    const dto = {}
    if (criando || 'tarefa' in body) {
        dto.tarefa = texto(body.tarefa, 300)
        if (!dto.tarefa) throw new AppError('Informe a tarefa', 400)
    }
    if ('grupo' in body) dto.grupo = texto(body.grupo, 80)
    if ('detalhe' in body) dto.detalhe = texto(body.detalhe, 500)
    if ('feito' in body) {
        dto.feito = body.feito === true
        dto.feitoEm = dto.feito ? new Date() : null
    }
    // Data vazia vinda do formulário mantém a que o "feito" acabou de pôr.
    if (body.feitoEm) dto.feitoEm = dataDoDia(body.feitoEm)
    return dto
}
