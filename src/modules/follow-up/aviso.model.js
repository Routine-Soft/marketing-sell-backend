import mongoose from 'mongoose'

// Marca que um aviso diário já saiu (ex.: lembrete de follow-up das 8h): o índice único garante um por conta por dia,
// mesmo se o servidor reiniciar.
const avisoSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    tipo: { type: String, required: true },
    dia: { type: String, required: true },
}, { timestamps: true })

avisoSchema.index({ tenantId: 1, tipo: 1, dia: 1 }, { unique: true })

const AvisoModel = mongoose.models.avisos || mongoose.model('avisos', avisoSchema)

export default AvisoModel
