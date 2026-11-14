import mongoose from 'mongoose'

// O que foi marcado em um dia da rotina. As tarefas com meta (leads, contatos) não ficam aqui: são contadas na hora.
const rotinaDiaSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    // 'AAAA-MM-DD' no dia de Brasília.
    dia: { type: String, required: true },
    feitas: { type: [String], default: [] },
}, { timestamps: true })

rotinaDiaSchema.index({ tenantId: 1, dia: 1 }, { unique: true })

const RotinaDiaModel = mongoose.models.rotinadias || mongoose.model('rotinadias', rotinaDiaSchema)

export default RotinaDiaModel
