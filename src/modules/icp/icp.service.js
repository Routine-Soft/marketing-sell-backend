import IcpModel from './icp.model.js'
import PersonaModel from './persona.model.js'
import { icpDTO, personaDTO } from './icp.dto.js'
import AppError from '../../errors/AppError.js'

// A persona só pode ficar num ICP do mesmo negócio.
async function conferirIcp(tenantId, icpId) {
    if (icpId && !(await IcpModel.exists({ _id: icpId, tenantId }))) throw new AppError('ICP não encontrado', 404)
}

export const IcpService = {
    // Os ICPs do negócio e as personas de todos eles (a tela agrupa pelo icpId).
    async listar(tenantId) {
        const [icps, personas] = await Promise.all([
            IcpModel.find({ tenantId }).sort({ createdAt: 1 }),
            PersonaModel.find({ tenantId }).sort({ createdAt: 1 }),
        ])
        return { icps, personas }
    },

    criarIcp(tenantId, body) {
        return IcpModel.create({ ...icpDTO(body, { criando: true }), tenantId })
    },

    async editarIcp(tenantId, id, body) {
        const icp = await IcpModel.findOneAndUpdate({ _id: id, tenantId }, { $set: icpDTO(body) }, { new: true })
        if (!icp) throw new AppError('ICP não encontrado', 404)
        return icp
    },

    // Excluir o ICP apaga as personas dele.
    async excluirIcp(tenantId, id) {
        const icp = await IcpModel.findOneAndDelete({ _id: id, tenantId })
        if (!icp) throw new AppError('ICP não encontrado', 404)
        await PersonaModel.deleteMany({ tenantId, icpId: icp._id })
    },

    async criarPersona(tenantId, body) {
        const dto = personaDTO(body, { criando: true })
        await conferirIcp(tenantId, dto.icpId)
        return PersonaModel.create({ ...dto, tenantId })
    },

    async editarPersona(tenantId, id, body) {
        const dto = personaDTO(body)
        await conferirIcp(tenantId, dto.icpId)
        const persona = await PersonaModel.findOneAndUpdate({ _id: id, tenantId }, { $set: dto }, { new: true })
        if (!persona) throw new AppError('Persona não encontrada', 404)
        return persona
    },

    async excluirPersona(tenantId, id) {
        const persona = await PersonaModel.findOneAndDelete({ _id: id, tenantId })
        if (!persona) throw new AppError('Persona não encontrada', 404)
    },
}
