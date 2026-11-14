import NegocioModel from './negocio.model.js'
import UserModel from '../user/user.model.js'
import ChecklistModel from '../checklist/checklist.model.js'
import { MODELO_PADRAO } from './modelos.padrao.js'

// Cria as listas de preparação e anúncios de um negócio novo com os itens do modelo.
export async function semearListas(tenantId, listas = {}) {
    const itens = ['preparacao', 'anuncios'].flatMap((lista) => (listas[lista] ?? []).map((item, ordem) => ({
        tenantId, lista, ordem, grupo: item.grupo ?? '', tarefa: item.tarefa, detalhe: item.detalhe ?? '',
    })))
    if (itens.length) await ChecklistModel.insertMany(itens)
}

// Negócios da conta, do mais antigo ao mais novo. Conta de antes dos negócios ganha o primeiro na hora, com o mesmo
// _id da conta (os dados que ela já tinha ficam nele) e o modelo da planilha.
export async function garantirNegocios(contaId) {
    const negocios = await NegocioModel.find({ contaId }).sort({ createdAt: 1, _id: 1 })
    if (negocios.length) return negocios
    const dono = await UserModel.findById(contaId, 'nomeEmpresa')
    try {
        const negocio = await NegocioModel.create({
            _id: contaId,
            contaId,
            nome: dono?.nomeEmpresa || 'Meu negócio',
            abas: MODELO_PADRAO.abas,
            modelo: MODELO_PADRAO.nome,
            rotina: MODELO_PADRAO.rotina,
        })
        await semearListas(negocio._id, MODELO_PADRAO.listas)
        return [negocio]
    } catch (erro) {
        // Duas telas abrindo ao mesmo tempo: a outra já criou.
        if (erro.code === 11000) return NegocioModel.find({ contaId }).sort({ createdAt: 1, _id: 1 })
        throw erro
    }
}

// Negócio em que a pessoa está trabalhando: o último em que entrou, ou o primeiro da conta.
export async function negocioDaSessao(user) {
    const negocios = await garantirNegocios(user.tenantId)
    return negocios.find((negocio) => String(negocio._id) === String(user.negocioAtivo)) ?? negocios[0]
}

export async function idsDosNegocios(contaId) {
    return (await garantirNegocios(contaId)).map((negocio) => negocio._id)
}

// { [negocioId]: contaId } das contas pedidas (para somar uso e leads por conta).
export async function contaDeCadaNegocio(contaIds) {
    const negocios = await NegocioModel.find({ contaId: { $in: contaIds } }, 'contaId').lean()
    const mapa = Object.fromEntries(contaIds.map((id) => [String(id), String(id)]))
    negocios.forEach((negocio) => { mapa[String(negocio._id)] = String(negocio.contaId) })
    return mapa
}

export async function negocioComDono(negocioId) {
    const negocio = await NegocioModel.findById(negocioId, 'contaId nome').lean()
    const dono = await UserModel.findById(negocio?.contaId ?? negocioId)
    return { negocio, dono }
}

// Rotina do negócio; sem negócio gravado (sessão antiga), a do modelo da planilha.
export async function rotinaDoNegocio(negocioId) {
    const negocio = await NegocioModel.findById(negocioId, 'rotina').lean()
    return negocio?.rotina ?? MODELO_PADRAO.rotina
}
