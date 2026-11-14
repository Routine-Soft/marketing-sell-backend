import mongoose from 'mongoose'

export const TIPOS_COMUNIDADE = ['grupo', 'evento', 'associacao']

// Grupo, evento ou associação onde estão os possíveis clientes. É a aba "Comunidades e eventos" da planilha.
const comunidadeSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    tipo: { type: String, enum: TIPOS_COMUNIDADE, default: 'grupo' },
    // Facebook, WhatsApp, Telegram, Discord ou a cidade do evento.
    plataforma: { type: String, default: '' },
    nome: { type: String, required: true },
    link: { type: String, default: '' },
    // Entrou no grupo ou se inscreveu no evento.
    entrei: { type: Boolean, default: false },
    dataEvento: { type: Date, default: null },
    participei: { type: Boolean, default: false },
    observacao: { type: String, default: '' },
}, { timestamps: true })

comunidadeSchema.index({ tenantId: 1, createdAt: 1 })
comunidadeSchema.index({ dataEvento: 1 })

const ComunidadeModel = mongoose.models.comunidades || mongoose.model('comunidades', comunidadeSchema)

export default ComunidadeModel
