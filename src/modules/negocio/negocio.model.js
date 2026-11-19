import mongoose from 'mongoose'
import { rotinaSchema } from './rotina.schema.js'

// Um negócio da conta (ex.: Sonélia e Stanley Andrade, do mesmo dono). Cada negócio tem os próprios dados:
// o _id do negócio é o "tenantId" de leads, rotina, parceiros etc. O primeiro negócio de uma conta usa o mesmo _id
// da conta, por isso os dados de antes dos negócios continuam no lugar.
const negocioSchema = new mongoose.Schema({
    contaId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    nome: { type: String, required: true },
    site: { type: String, default: '' },
    // Abas que aparecem no menu (a Rotina diária aparece sempre). Ver ABAS em modelos.padrao.js.
    abas: { type: [String], default: [] },
    // Modelo de onde o negócio nasceu (só para mostrar).
    modelo: { type: String, default: '' },
    rotina: { type: rotinaSchema, default: () => ({}) },
}, { timestamps: true })

negocioSchema.index({ contaId: 1, createdAt: 1 })

const NegocioModel = mongoose.models.negocios || mongoose.model('negocios', negocioSchema)

export default NegocioModel
