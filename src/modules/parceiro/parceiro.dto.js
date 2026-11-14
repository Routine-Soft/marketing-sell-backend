import { TIPOS_PARCEIRO, STATUS_PARCEIRO } from './parceiro.model.js'
import { CANAIS_CONTATO } from '../lead/contato.model.js'
import { texto, dataDoDia, umDe } from '../shared/utils/campos.js'
import AppError from '../../errors/AppError.js'

// Só os campos enviados entram (a tela salva uma célula por vez).
export function parceiroDTO(body = {}, { criando = false } = {}) {
    const dto = {}
    if (criando || 'nome' in body) {
        dto.nome = texto(body.nome, 160)
        if (!dto.nome) throw new AppError('Informe o nome', 400)
    }
    if ('tipo' in body) dto.tipo = umDe(body.tipo, TIPOS_PARCEIRO, 'Tipo inválido')
    if ('status' in body) dto.status = umDe(body.status, STATUS_PARCEIRO, 'Situação inválida')
    if ('canal' in body) dto.canal = body.canal ? umDe(body.canal, CANAIS_CONTATO, 'Canal inválido') : ''
    if ('primeiroContatoEm' in body) dto.primeiroContatoEm = dataDoDia(body.primeiroContatoEm)
    if ('contato' in body) dto.contato = texto(body.contato, 200)
    if ('comissao' in body) dto.comissao = texto(body.comissao, 120)
    if ('linkRastreavel' in body) dto.linkRastreavel = texto(body.linkRastreavel, 500)
    if ('observacao' in body) dto.observacao = texto(body.observacao, 2000)
    return dto
}
