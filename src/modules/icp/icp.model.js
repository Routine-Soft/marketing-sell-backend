import mongoose from 'mongoose'

// Campos de texto do ICP (perfil de cliente ideal: a empresa ou o tipo de cliente). "anotacoes" = campo livre.
export const CAMPOS_DO_ICP = [
    'nome', 'tamanho', 'regiao', 'tempo', // perfil da empresa
    'decisor', 'usuarios', 'influencia', // quem decide e quem usa
    'situacaoAtual', 'dor', 'gatilho', 'ticket', 'ondeEncontrar', 'antiIcp', 'anotacoes',
]

const campos = Object.fromEntries(CAMPOS_DO_ICP.map((campo) => [campo, { type: String, default: '' }]))

// ICP do negócio. As personas ficam ligadas a ele (persona.model.js).
const icpSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'negocios', required: true },
    ...campos,
}, { timestamps: true })

icpSchema.index({ tenantId: 1, createdAt: 1 })

const IcpModel = mongoose.models.icps || mongoose.model('icps', icpSchema)

export default IcpModel
