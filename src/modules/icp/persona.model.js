import mongoose from 'mongoose'

// Campos de texto da persona (a pessoa que decide ou usa, dentro de um ICP). "anotacoes" = campo livre.
export const CAMPOS_DA_PERSONA = [
    'nome', 'cargo', 'idade', 'formacao', // quem é
    'rotina', 'objetivos', 'frustracoes', 'objecoes', 'canais', 'abordagem', 'frase', 'anotacoes',
]

const campos = Object.fromEntries(CAMPOS_DA_PERSONA.map((campo) => [campo, { type: String, default: '' }]))

const personaSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'negocios', required: true },
    icpId: { type: mongoose.Schema.Types.ObjectId, ref: 'icps', required: true },
    ...campos,
}, { timestamps: true })

personaSchema.index({ tenantId: 1, icpId: 1, createdAt: 1 })

const PersonaModel = mongoose.models.personas || mongoose.model('personas', personaSchema)

export default PersonaModel
