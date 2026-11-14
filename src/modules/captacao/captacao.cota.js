import mongoose from 'mongoose'
import BuscaModel from './busca.model.js'
import UserModel from '../user/user.model.js'
import { contaDeCadaNegocio } from '../negocio/negocio.contas.js'

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

// Uso do mês de várias contas de uma vez, somando os negócios de cada uma: { [contaId]: páginas }.
export async function usoGoogleNoMes(contaIds) {
    const contaDe = await contaDeCadaNegocio(contaIds)
    const linhas = await BuscaModel.aggregate([
        { $match: { tenantId: { $in: Object.keys(contaDe).map((id) => new mongoose.Types.ObjectId(id)) }, createdAt: { $gte: inicioDoMes() } } },
        { $group: { _id: '$tenantId', total: { $sum: '$requisicoesGoogle' } } },
    ])
    const uso = {}
    linhas.forEach((linha) => {
        const conta = contaDe[String(linha._id)]
        uso[conta] = (uso[conta] ?? 0) + linha.total
    })
    return uso
}

// A cota é da conta: os negócios dela dividem o mesmo limite.
export async function cotaGoogle(contaId) {
    const dono = await UserModel.findById(contaId, 'cotaGoogleMensal')
    const limite = dono?.cotaGoogleMensal ?? cotaPadrao()
    const usado = (await usoGoogleNoMes([contaId]))[String(contaId)] ?? 0
    return { limite, usado, restante: Math.max(0, limite - usado) }
}
