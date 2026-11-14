import mongoose from 'mongoose'

export const TIPOS_DE_IDEIA = ['video', 'artigo']
// video: ideia → roteiro pronto → postado; artigo: ideia → texto pronto → publicado.
export const STATUS_DE_IDEIA = ['ideia', 'pronto', 'publicado']

// Ideia de vídeo (roteiro + legenda) ou de artigo do blog (texto + resumo), planejada para um dia.
// Um dia pode ter várias; sem dia = banco de ideias.
const ideiaSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'negocios', required: true },
    tipo: { type: String, enum: TIPOS_DE_IDEIA, required: true },
    // 'AAAA-MM-DD' (dia de Brasília) em que vai ser postado; '' = sem data.
    dia: { type: String, default: '' },
    titulo: { type: String, default: '' },
    roteiro: { type: String, default: '' },
    legenda: { type: String, default: '' },
    status: { type: String, enum: STATUS_DE_IDEIA, default: 'ideia' },
}, { timestamps: true })

ideiaSchema.index({ tenantId: 1, tipo: 1, dia: 1, createdAt: 1 })

const IdeiaModel = mongoose.models.ideias || mongoose.model('ideias', ideiaSchema)

export default IdeiaModel
