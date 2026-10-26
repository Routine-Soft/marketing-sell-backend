import mongoose from 'mongoose'
import BuscaModel from './busca.model.js'
import UserModel from '../user/user.model.js'

// Cota mensal de páginas do Google por conta: a chave do Google é do sistema e cada página é cobrada.
// Vale o que o super admin definiu na conta (cotaGoogleMensal) ou o padrão do .env.
export function cotaPadrao() {
    const valor = Number.parseInt(process.env.GOOGLE_COTA_MENSAL, 10)
    return Number.isFinite(valor) && valor >= 0 ? valor : 100
}

function inicioDoMes() {
    const agora = new Date()
    return new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), 1))
}

// Uso do mês de várias contas de uma vez: { [tenantId]: páginas }.
export async function usoGoogleNoMes(tenantIds) {
    const linhas = await BuscaModel.aggregate([
        { $match: { tenantId: { $in: tenantIds.map((id) => new mongoose.Types.ObjectId(String(id))) }, createdAt: { $gte: inicioDoMes() } } },
        { $group: { _id: '$tenantId', total: { $sum: '$requisicoesGoogle' } } },
    ])
    return Object.fromEntries(linhas.map((l) => [String(l._id), l.total]))
}

export async function cotaGoogle(tenantId) {
    const dono = await UserModel.findById(tenantId, 'cotaGoogleMensal')
    const limite = dono?.cotaGoogleMensal ?? cotaPadrao()
    const usado = (await usoGoogleNoMes([tenantId]))[String(tenantId)] ?? 0
    return { limite, usado, restante: Math.max(0, limite - usado) }
}
