import IdeiaModel from './ideia.model.js'
import { ideiaDTO, periodoDTO, tipoDTO } from './ideia.dto.js'
import AppError from '../../errors/AppError.js'

export const IdeiaService = {
    // As ideias dos dias da semana na tela e as sem data (banco de ideias).
    listar(tenantId, query) {
        const tipo = tipoDTO(query.tipo)
        const { de, ate } = periodoDTO(query)
        return IdeiaModel.find({ tenantId, tipo, $or: [{ dia: { $gte: de, $lte: ate } }, { dia: '' }] }).sort({ dia: 1, createdAt: 1 })
    },

    criar(tenantId, body) {
        return IdeiaModel.create({ ...ideiaDTO(body, { criando: true }), tenantId })
    },

    async editar(tenantId, id, body) {
        const ideia = await IdeiaModel.findOneAndUpdate({ _id: id, tenantId }, { $set: ideiaDTO(body) }, { new: true })
        if (!ideia) throw new AppError('Ideia não encontrada', 404)
        return ideia
    },

    async excluir(tenantId, id) {
        const ideia = await IdeiaModel.findOneAndDelete({ _id: id, tenantId })
        if (!ideia) throw new AppError('Ideia não encontrada', 404)
    },
}
