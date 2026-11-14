import ParceiroModel from './parceiro.model.js'
import { parceiroDTO } from './parceiro.dto.js'
import AppError from '../../errors/AppError.js'

export const ParceiroService = {
    listar(tenantId) {
        return ParceiroModel.find({ tenantId }).sort({ createdAt: 1, _id: 1 })
    },

    criar(tenantId, body) {
        return ParceiroModel.create({ ...parceiroDTO(body, { criando: true }), tenantId })
    },

    // Mandou mensagem pela primeira vez (saiu de "listado")? A data do 1º contato entra sozinha.
    async editar(tenantId, id, body) {
        const parceiro = await ParceiroModel.findOne({ _id: id, tenantId })
        if (!parceiro) throw new AppError('Parceiro não encontrado', 404)
        const dados = parceiroDTO(body)
        parceiro.set(dados)
        if (dados.status && dados.status !== 'listado' && !parceiro.primeiroContatoEm && !('primeiroContatoEm' in dados)) {
            parceiro.primeiroContatoEm = new Date()
        }
        return parceiro.save()
    },

    async excluir(tenantId, id) {
        const parceiro = await ParceiroModel.findOneAndDelete({ _id: id, tenantId })
        if (!parceiro) throw new AppError('Parceiro não encontrado', 404)
    },
}
