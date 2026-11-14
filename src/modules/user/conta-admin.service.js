import mongoose from 'mongoose'
import UserModel from './user.model.js'
import LeadModel from '../lead/lead.model.js'
import NegocioModel from '../negocio/negocio.model.js'
import ModeloModel from '../negocio/modelo.model.js'
import { DADOS_DO_NEGOCIO } from '../negocio/negocio.dados.js'
import { contaDeCadaNegocio } from '../negocio/negocio.contas.js'
import { cotaPadrao, usoGoogleNoMes } from '../captacao/captacao.cota.js'
import AppError from '../../errors/AppError.js'

// Painel do super_admin: as contas (cada uma é o usuário dono, role 'admin') com uso do mês.
export const ContaAdminService = {
    async listar() {
        const donos = await UserModel.find({ role: 'admin', $expr: { $eq: ['$_id', '$tenantId'] } }).sort({ createdAt: -1 })
        const ids = donos.map((d) => d._id)
        const contaDe = await contaDeCadaNegocio(ids)
        const [uso, leads, negocios] = await Promise.all([
            usoGoogleNoMes(ids),
            LeadModel.aggregate([{ $match: { tenantId: { $in: Object.keys(contaDe).map((id) => new mongoose.Types.ObjectId(id)) } } }, { $group: { _id: '$tenantId', total: { $sum: 1 } } }]),
            NegocioModel.aggregate([{ $match: { contaId: { $in: ids } } }, { $group: { _id: '$contaId', total: { $sum: 1 } } }]),
        ])
        const leadsPorConta = {}
        leads.forEach((linha) => {
            const conta = contaDe[String(linha._id)]
            leadsPorConta[conta] = (leadsPorConta[conta] ?? 0) + linha.total
        })
        const negociosPorConta = Object.fromEntries(negocios.map((linha) => [String(linha._id), linha.total]))

        return {
            cotaPadrao: cotaPadrao(),
            contas: donos.map((dono) => ({
                ...dono.toJSON(),
                leads: leadsPorConta[String(dono._id)] ?? 0,
                negocios: negociosPorConta[String(dono._id)] ?? 1,
                googleUsadoNoMes: uso[String(dono._id)] ?? 0,
                cotaGoogle: dono.cotaGoogleMensal ?? cotaPadrao(),
            })),
        }
    },

    // `cota` vazia volta ao padrão do sistema.
    async definirCota(id, cota) {
        const valor = cota === null || cota === '' || cota === undefined ? null : Number.parseInt(cota, 10)
        if (valor !== null && (!Number.isFinite(valor) || valor < 0)) {
            throw new AppError('Informe um número de páginas válido', 400)
        }
        const dono = await UserModel.findOneAndUpdate({ _id: id, role: 'admin' }, { $set: { cotaGoogleMensal: valor } }, { new: true })
        if (!dono) throw new AppError('Conta não encontrada', 404)
        return dono
    },

    // Apaga a conta inteira: usuários, negócios, modelos e tudo o que é de cada negócio.
    async apagar(id) {
        const dono = await UserModel.findOne({ _id: id, role: 'admin' })
        if (!dono) throw new AppError('Conta não encontrada', 404)
        const contaId = dono.tenantId
        const negocios = Object.keys(await contaDeCadaNegocio([contaId])).map((negocioId) => new mongoose.Types.ObjectId(negocioId))
        await Promise.all(DADOS_DO_NEGOCIO.map((Model) => Model.deleteMany({ tenantId: { $in: negocios } })))
        await Promise.all([NegocioModel.deleteMany({ contaId }), ModeloModel.deleteMany({ contaId })])
        await UserModel.deleteMany({ tenantId: contaId })
        return null
    },
}
