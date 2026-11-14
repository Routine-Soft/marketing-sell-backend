import { TIPOS_COMUNIDADE } from './comunidade.model.js'
import { texto, dataDoDia, umDe } from '../shared/utils/campos.js'
import AppError from '../../errors/AppError.js'

// Só os campos enviados entram (a tela salva uma célula por vez).
export function comunidadeDTO(body = {}, { criando = false } = {}) {
    const dto = {}
    if (criando || 'nome' in body) {
        dto.nome = texto(body.nome, 160)
        if (!dto.nome) throw new AppError('Informe o nome', 400)
    }
    if ('tipo' in body) dto.tipo = umDe(body.tipo, TIPOS_COMUNIDADE, 'Tipo inválido')
    if ('plataforma' in body) dto.plataforma = texto(body.plataforma, 120)
    if ('link' in body) dto.link = texto(body.link, 500)
    if ('entrei' in body) dto.entrei = body.entrei === true
    if ('participei' in body) dto.participei = body.participei === true
    if ('dataEvento' in body) dto.dataEvento = dataDoDia(body.dataEvento)
    if ('observacao' in body) dto.observacao = texto(body.observacao, 2000)
    return dto
}
