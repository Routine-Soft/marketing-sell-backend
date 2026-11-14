import ChecklistModel from './checklist.model.js'
import UserModel from '../user/user.model.js'
import { ITENS_PADRAO } from './checklist.padrao.js'
import { listaDTO, itemDTO } from './checklist.dto.js'
import AppError from '../../errors/AppError.js'

export const ChecklistService = {
    // Na primeira vez que a conta abre a lista, ela nasce com os itens da planilha. O que já nasceu fica anotado
    // no dono da conta: apagar todos os itens não traz os itens padrão de volta.
    async listar(tenantId, nomeDaLista) {
        const lista = listaDTO(nomeDaLista)
        const dono = await UserModel.findOneAndUpdate(
            { _id: tenantId, checklistsCriadas: { $ne: lista } },
            { $addToSet: { checklistsCriadas: lista } },
        )
        if (dono) {
            await ChecklistModel.insertMany(ITENS_PADRAO[lista].map(([grupo, tarefa, detalhe], ordem) => ({ tenantId, lista, grupo, tarefa, detalhe, ordem })))
        }
        return ChecklistModel.find({ tenantId, lista }).sort({ ordem: 1, _id: 1 })
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
