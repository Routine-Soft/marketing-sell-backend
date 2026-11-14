import mongoose from 'mongoose'

// Listas de tarefas que se faz uma vez só: 'preparacao' e 'anuncios' (abas da planilha).
export const LISTAS = ['preparacao', 'anuncios']

const checklistSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    lista: { type: String, enum: LISTAS, required: true },
    // Área (Contato, Vídeo, Blog...) na preparação; plataforma (Google Ads, Meta) nos anúncios.
    grupo: { type: String, default: '' },
    tarefa: { type: String, required: true },
    detalhe: { type: String, default: '' },
    feito: { type: Boolean, default: false },
    feitoEm: { type: Date, default: null },
    ordem: { type: Number, default: 0 },
}, { timestamps: true })

checklistSchema.index({ tenantId: 1, lista: 1, ordem: 1 })

const ChecklistModel = mongoose.models.checklists || mongoose.model('checklists', checklistSchema)

export default ChecklistModel
