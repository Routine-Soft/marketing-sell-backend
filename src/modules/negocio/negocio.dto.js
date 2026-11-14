import mongoose from 'mongoose'
import { ABAS, AUTOS, CONTAGENS } from './modelos.padrao.js'
import { texto } from '../shared/utils/campos.js'
import AppError from '../../errors/AppError.js'

const COR = /^#[0-9a-f]{6}$/i
const MAXIMO_DE_BLOCOS = 30
const MAXIMO_DE_LINHAS = 150

function abasDTO(abas) {
    if (!Array.isArray(abas)) throw new AppError('Abas inválidas', 400)
    return ABAS.filter((aba) => abas.includes(aba))
}

// Só os campos enviados entram.
export function negocioDTO(body = {}, { criando = false } = {}) {
    const dto = {}
    if (criando || 'nome' in body) {
        dto.nome = texto(body.nome, 80)
        if (!dto.nome) throw new AppError('Informe o nome do negócio', 400)
    }
    if ('site' in body) dto.site = texto(body.site, 200)
    if ('abas' in body) dto.abas = abasDTO(body.abas)
    return dto
}

export function modeloDTO(body = {}) {
    const nome = texto(body.nome, 80)
    if (!nome) throw new AppError('Informe o nome do modelo', 400)
    return { nome, descricao: texto(body.descricao, 300) }
}

function idNovo() {
    return String(new mongoose.Types.ObjectId())
}

// Rotina inteira vinda da tela de edição. Bloco ou tarefa sem id ganha um; a tarefa precisa de um bloco que exista.
export function rotinaDTO(body = {}) {
    if (!Array.isArray(body.blocos) || !Array.isArray(body.linhas)) throw new AppError('Rotina inválida', 400)
    if (body.blocos.length > MAXIMO_DE_BLOCOS || body.linhas.length > MAXIMO_DE_LINHAS) throw new AppError('Rotina grande demais', 400)

    const blocos = body.blocos.map((bloco) => {
        const nome = texto(bloco?.nome, 60)
        if (!nome) throw new AppError('Informe o nome do bloco', 400)
        return { id: texto(bloco.id, 40) || idNovo(), nome, cor: COR.test(bloco.cor ?? '') ? bloco.cor : '#2a7de1' }
    })
    const idsDosBlocos = new Set(blocos.map((bloco) => bloco.id))
    if (idsDosBlocos.size !== blocos.length) throw new AppError('Rotina inválida', 400)

    const idsDasLinhas = new Set()
    const linhas = body.linhas.map((linha) => {
        const titulo = texto(linha?.titulo, 160)
        if (!titulo) throw new AppError('Informe o nome da tarefa', 400)
        if (!idsDosBlocos.has(linha.bloco)) throw new AppError('Escolha o bloco da tarefa', 400)
        const tipo = ['tarefa', 'opcional', 'automatico'].includes(linha.tipo) ? linha.tipo : 'tarefa'
        const meta = Number.parseInt(linha.meta, 10)
        const id = texto(linha.id, 40) || idNovo()
        if (idsDasLinhas.has(id)) throw new AppError('Rotina inválida', 400)
        idsDasLinhas.add(id)
        const dto = {
            id,
            bloco: linha.bloco,
            tipo,
            titulo,
            meta: Number.isFinite(meta) && meta > 0 ? Math.min(meta, 10000) : null,
            auto: tipo === 'tarefa' && AUTOS.includes(linha.auto) ? linha.auto : '',
            contagem: tipo === 'automatico' && CONTAGENS.includes(linha.contagem) ? linha.contagem : '',
            dias: Array.isArray(linha.dias) ? [...new Set(linha.dias.map(Number).filter((dia) => dia >= 1 && dia <= 5))].sort() : [],
        }
        if (dto.tipo === 'automatico' && !dto.contagem) throw new AppError('Escolha o que a linha automática conta', 400)
        // Marcar sozinha pela contagem precisa de meta (follow-up em dia não precisa).
        if (dto.auto && dto.auto !== 'followUp' && !dto.meta) throw new AppError('Informe a meta da tarefa que se marca sozinha', 400)
        if (dto.dias.length === 5) dto.dias = []
        return dto
    })
    return { blocos, linhas }
}
