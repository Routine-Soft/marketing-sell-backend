import ChecklistModel from './checklist.model.js'
import { listaDTO, itemDTO } from './checklist.dto.js'
import AppError from '../../errors/AppError.js'

export const ChecklistService = {
    // A lista nasce com os itens do modelo do negócio (ver negocio.contas.js, semearListas).
    listar(tenantId, nomeDaLista) {
        return ChecklistModel.find({ tenantId, lista: listaDTO(nomeDaLista) }).sort({ ordem: 1, _id: 1 })
    },

    async criar(tenantId, nomeDaLista, body) {
        const lista = listaDTO(nomeDaLista)
        const ultimo = await ChecklistModel.findOne({ tenantId, lista }).sort({ ordem: -1 }).lean()
        return ChecklistModel.create({ ...itemDTO(body, { criando: true }), tenantId, lista, ordem: (ultimo?.ordem ?? -1) + 1 })
    },

    async editar(tenantId, id, body) {
        const item = await ChecklistModel.findOneAndUpdate({ _id: id, tenantId }, { $set: itemDTO(body) }, { new: true })
        if (!item) throw new AppError('Item não encontrado', 404)
        return item
    },

    async excluir(tenantId, id) {
        const item = await ChecklistModel.findOneAndDelete({ _id: id, tenantId })
        if (!item) throw new AppError('Item não encontrado', 404)
    },
}
