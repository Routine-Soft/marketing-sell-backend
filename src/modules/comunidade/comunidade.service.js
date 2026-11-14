import ComunidadeModel from './comunidade.model.js'
import { comunidadeDTO } from './comunidade.dto.js'
import AppError from '../../errors/AppError.js'

export const ComunidadeService = {
    listar(tenantId) {
        return ComunidadeModel.find({ tenantId }).sort({ createdAt: 1, _id: 1 })
    },

    criar(tenantId, body) {
        return ComunidadeModel.create({ ...comunidadeDTO(body, { criando: true }), tenantId })
    },

    async editar(tenantId, id, body) {
        const comunidade = await ComunidadeModel.findOneAndUpdate({ _id: id, tenantId }, { $set: comunidadeDTO(body) }, { new: true })
        if (!comunidade) throw new AppError('Registro não encontrado', 404)
        return comunidade
    },

    async excluir(tenantId, id) {
        const comunidade = await ComunidadeModel.findOneAndDelete({ _id: id, tenantId })
        if (!comunidade) throw new AppError('Registro não encontrado', 404)
    },
}
