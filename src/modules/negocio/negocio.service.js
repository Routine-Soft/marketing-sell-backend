import mongoose from 'mongoose'
import NegocioModel from './negocio.model.js'
import ModeloModel from './modelo.model.js'
import UserModel from '../user/user.model.js'
import ChecklistModel from '../checklist/checklist.model.js'
import { MODELOS_DO_SISTEMA } from './modelos.padrao.js'
import { garantirNegocios, negocioDaSessao, semearListas } from './negocio.contas.js'
import { negocioDTO, modeloDTO, rotinaDTO } from './negocio.dto.js'
import { DADOS_DO_NEGOCIO } from './negocio.dados.js'
import AppError from '../../errors/AppError.js'

function resumoDoModelo(modelo, proprio) {
    return {
        id: String(modelo.id ?? modelo._id),
        nome: modelo.nome,
        descricao: modelo.descricao,
        proprio,
        blocos: modelo.rotina?.blocos?.length ?? 0,
        tarefas: modelo.rotina?.linhas?.filter((linha) => linha.tipo === 'tarefa').length ?? 0,
    }
}

async function acharModelo(contaId, modeloId) {
    const doSistema = MODELOS_DO_SISTEMA.find((modelo) => modelo.id === modeloId)
    if (doSistema) return doSistema
    if (!mongoose.isValidObjectId(modeloId)) throw new AppError('Modelo não encontrado', 404)
    const proprio = await ModeloModel.findOne({ _id: modeloId, contaId }).lean()
    if (!proprio) throw new AppError('Modelo não encontrado', 404)
    return proprio
}

async function negocioDaConta(contaId, id) {
    if (!mongoose.isValidObjectId(id)) throw new AppError('Negócio não encontrado', 404)
    const negocio = await NegocioModel.findOne({ _id: id, contaId })
    if (!negocio) throw new AppError('Negócio não encontrado', 404)
    return negocio
}

export const NegocioService = {
    // Os negócios da conta e qual está aberto agora (o do token).
    async listar(contaId, ativoId) {
        const negocios = await garantirNegocios(contaId)
        return { ativo: String(ativoId), negocios }
    },

    async atual(contaId, ativoId) {
        const negocios = await garantirNegocios(contaId)
        return negocios.find((negocio) => String(negocio._id) === String(ativoId)) ?? negocios[0]
    },

    async criar(contaId, body) {
        const dados = negocioDTO(body, { criando: true })
        const modelo = await acharModelo(contaId, body.modeloId || MODELOS_DO_SISTEMA[0].id)
        await garantirNegocios(contaId)
        const negocio = await NegocioModel.create({
            ...dados,
            contaId,
            abas: dados.abas ?? modelo.abas,
            modelo: modelo.nome,
            rotina: modelo.rotina,
        })
        await semearListas(negocio._id, modelo.listas)
        return negocio
    },

    async editar(contaId, id, body) {
        const negocio = await negocioDaConta(contaId, id)
        negocio.set(negocioDTO(body))
        return negocio.save()
    },

    // Apaga o negócio e tudo o que é dele (leads, rotina, parceiros...). O último negócio da conta não pode sair.
    async excluir(contaId, id, ativoId) {
        const negocio = await negocioDaConta(contaId, id)
        if (String(negocio._id) === String(ativoId)) throw new AppError('Saia deste negócio antes de excluir', 400)
        const total = await NegocioModel.countDocuments({ contaId })
        if (total <= 1) throw new AppError('A conta precisa ter pelo menos um negócio', 400)
        await Promise.all(DADOS_DO_NEGOCIO.map((Model) => Model.deleteMany({ tenantId: negocio._id })))
        await negocio.deleteOne()
        await UserModel.updateMany({ negocioAtivo: negocio._id }, { $set: { negocioAtivo: null } })
    },

    // Entrar em outro negócio: grava como o aberto da pessoa e devolve a sessão nova (o token leva o negócio).
    async entrar(userId, contaId, id, emitirSessao) {
        const negocio = await negocioDaConta(contaId, id)
        const user = await UserModel.findById(userId)
        user.negocioAtivo = negocio._id
        return emitirSessao(user)
    },

    async salvarRotina(contaId, ativoId, body) {
        const negocio = await negocioDaConta(contaId, ativoId)
        negocio.rotina = rotinaDTO(body)
        await negocio.save()
        return negocio.rotina
    },

    async modelos(contaId) {
        const proprios = await ModeloModel.find({ contaId }).sort({ createdAt: 1 }).lean()
        return [
            ...MODELOS_DO_SISTEMA.map((modelo) => resumoDoModelo(modelo, false)),
            ...proprios.map((modelo) => resumoDoModelo(modelo, true)),
        ]
    },

    // Guarda o negócio aberto (rotina, abas e listas de hoje) como modelo da conta.
    async salvarComoModelo(contaId, ativoId, body) {
        const dados = modeloDTO(body)
        const negocio = await negocioDaConta(contaId, ativoId)
        const itens = await ChecklistModel.find({ tenantId: negocio._id }).sort({ ordem: 1, _id: 1 }).lean()
        const listas = { preparacao: [], anuncios: [] }
        itens.forEach((item) => listas[item.lista]?.push({ grupo: item.grupo, tarefa: item.tarefa, detalhe: item.detalhe }))
        const modelo = await ModeloModel.create({ ...dados, contaId, abas: negocio.abas, rotina: negocio.rotina, listas })
        return resumoDoModelo(modelo.toObject(), true)
    },

    async excluirModelo(contaId, id) {
        if (!mongoose.isValidObjectId(id)) throw new AppError('Modelo não encontrado', 404)
        const modelo = await ModeloModel.findOneAndDelete({ _id: id, contaId })
        if (!modelo) throw new AppError('Modelo não encontrado', 404)
    },

    // Troca a rotina e as abas do negócio aberto pelas do modelo. O que já foi marcado nos dias fica guardado;
    // as listas só recebem os itens do modelo se estiverem vazias.
    async aplicarModelo(contaId, ativoId, modeloId) {
        const negocio = await negocioDaConta(contaId, ativoId)
        const modelo = await acharModelo(contaId, modeloId)
        negocio.set({ rotina: modelo.rotina, abas: modelo.abas, modelo: modelo.nome })
        await negocio.save()
        for (const lista of ['preparacao', 'anuncios']) {
            const temItens = await ChecklistModel.exists({ tenantId: negocio._id, lista })
            if (!temItens) await semearListas(negocio._id, { [lista]: modelo.listas?.[lista] ?? [] })
        }
        return negocio
    },

    negocioDaSessao,
}
