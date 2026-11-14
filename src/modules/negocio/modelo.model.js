import mongoose from 'mongoose'
import { rotinaSchema, listasSchema } from './rotina.schema.js'

// Modelo criado pela própria conta (a partir de um negócio que ela já ajustou). Os modelos prontos ficam em
// modelos.padrao.js, no código.
const modeloSchema = new mongoose.Schema({
    contaId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    nome: { type: String, required: true },
    descricao: { type: String, default: '' },
    abas: { type: [String], default: [] },
    rotina: { type: rotinaSchema, default: () => ({}) },
    listas: { type: listasSchema, default: () => ({}) },
}, { timestamps: true })

modeloSchema.index({ contaId: 1, createdAt: 1 })

const ModeloModel = mongoose.models.modelos || mongoose.model('modelos', modeloSchema)

export default ModeloModel
