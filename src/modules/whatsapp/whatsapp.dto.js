import AppError from '../../errors/AppError.js'
import { LEAD_STATUS } from '../lead/lead.model.js'
import { FONTES } from '../captacao/fontes/index.js'

const FONTES_DE_LEAD = [...Object.keys(FONTES), 'manual']
export const LIMITE_MAXIMO_DIARIO = 200

function inteiro(valor, minimo, maximo, mensagem) {
    const numero = Number(valor)
    if (!Number.isInteger(numero) || numero < minimo || numero > maximo) throw new AppError(mensagem, 400)
    return numero
}

function listaDe(valor, opcoes, mensagem) {
    if (!Array.isArray(valor) || valor.some((item) => !opcoes.includes(item))) throw new AppError(mensagem, 400)
    return [...new Set(valor)]
}

// Regra do envio automático. Só lê os campos enviados (a tela pode salvar só o "ligado/desligado").
export function regraDTO(body = {}) {
    const dados = {}
    if (body.ativo !== undefined) dados.ativo = body.ativo === true
    if (body.texto !== undefined) {
        const texto = String(body.texto ?? '').trim()
        if (!texto) throw new AppError('Escreva o texto da mensagem', 400)
        if (texto.length > 1000) throw new AppError('O texto da mensagem pode ter no máximo 1000 caracteres', 400)
        dados.texto = texto
    }
    if (body.situacoes !== undefined) {
        dados.situacoes = listaDe(body.situacoes, LEAD_STATUS, 'Situações inválidas')
        if (!dados.situacoes.length) throw new AppError('Escolha pelo menos uma situação de lead', 400)
    }
    if (body.fontes !== undefined) dados.fontes = listaDe(body.fontes, FONTES_DE_LEAD, 'Fontes inválidas')
    if (body.limiteDiario !== undefined) {
        dados.limiteDiario = inteiro(body.limiteDiario, 1, LIMITE_MAXIMO_DIARIO, 'Quantidade por dia: de 1 a 200')
    }
    if (body.horaInicio !== undefined) dados.horaInicio = inteiro(body.horaInicio, 0, 23, 'Horário inválido')
    if (body.horaFim !== undefined) dados.horaFim = inteiro(body.horaFim, 1, 24, 'Horário inválido')
    if (body.dias !== undefined) {
        dados.dias = listaDe(body.dias, [0, 1, 2, 3, 4, 5, 6], 'Dias inválidos').sort()
        if (!dados.dias.length) throw new AppError('Escolha pelo menos um dia da semana', 400)
    }
    return dados
}
