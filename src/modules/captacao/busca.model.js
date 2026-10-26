import mongoose from 'mongoose'

// Cada busca feita numa fonte: histórico da tela de captação e base da cota mensal do Google.
const buscaSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    fonte: { type: String, required: true },
    filtros: { type: mongoose.Schema.Types.Mixed, default: {} },
    encontrados: { type: Number, default: 0 },
    novos: { type: Number, default: 0 },
    // Páginas pedidas à Google Places API (cada uma é cobrada pelo Google).
    requisicoesGoogle: { type: Number, default: 0 },
}, { timestamps: true, minimize: false })

buscaSchema.index({ tenantId: 1, createdAt: -1 })

const BuscaModel = mongoose.models.buscas || mongoose.model('buscas', buscaSchema)

export default BuscaModel
