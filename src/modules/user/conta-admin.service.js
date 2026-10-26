import UserModel from './user.model.js'
import LeadModel from '../lead/lead.model.js'
import BuscaModel from '../captacao/busca.model.js'
import RemetenteModel from '../remetente/remetente.model.js'
import EnvioModel from '../envio/envio.model.js'
import { cotaPadrao, usoGoogleNoMes } from '../captacao/captacao.cota.js'
import AppError from '../../errors/AppError.js'

// Painel do super_admin: as contas (cada uma é o usuário dono, role 'admin') com uso do mês.
export const ContaAdminService = {
    async listar() {
        const donos = await UserModel.find({ role: 'admin', $expr: { $eq: ['$_id', '$tenantId'] } }).sort({ createdAt: -1 })
        const ids = donos.map((d) => d._id)
        const [uso, leads] = await Promise.all([
            usoGoogleNoMes(ids),
            LeadModel.aggregate([{ $match: { tenantId: { $in: ids } } }, { $group: { _id: '$tenantId', total: { $sum: 1 } } }]),
        ])
        const leadsPorConta = Object.fromEntries(leads.map((l) => [String(l._id), l.total]))

        return {
            cotaPadrao: cotaPadrao(),
            contas: donos.map((dono) => ({
                ...dono.toJSON(),
                leads: leadsPorConta[String(dono._id)] ?? 0,
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

    // Apaga a conta inteira: usuários, leads, histórico de buscas, remetentes e e-mails enviados.
    async apagar(id) {
        const dono = await UserModel.findOne({ _id: id, role: 'admin' })
        if (!dono) throw new AppError('Conta não encontrada', 404)
        const tenantId = dono.tenantId
        await Promise.all([
            LeadModel.deleteMany({ tenantId }),
            BuscaModel.deleteMany({ tenantId }),
            RemetenteModel.deleteMany({ tenantId }),
            EnvioModel.deleteMany({ tenantId }),
        ])
        await UserModel.deleteMany({ tenantId })
        return null
    },
}
