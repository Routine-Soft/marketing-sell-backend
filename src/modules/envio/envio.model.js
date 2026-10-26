import mongoose from 'mongoose'

// na_fila -> enviando -> enviado | erro. O teste da tela de remetentes já nasce 'enviado'.
export const ENVIO_STATUS = ['na_fila', 'enviando', 'enviado', 'erro']

// Cada e-mail mandado (ou esperando na fila). Também é a base do limite diário, que é por Gmail e não por
// remetente: dois negócios no mesmo Gmail somam no mesmo limite.
const envioSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    remetenteId: { type: mongoose.Schema.Types.ObjectId, ref: 'remetentes', required: true },
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'leads', default: null },
    // Gmail que manda.
    email: { type: String, required: true },
    para: { type: String, required: true },
    // Já com {nome}, {contato} e {cidade} trocados e o rodapé no final: sai exatamente o que foi pedido.
    assunto: { type: String, default: '' },
    corpoHtml: { type: String, default: '' },
    status: { type: String, enum: ENVIO_STATUS, default: 'enviado' },
    erro: { type: String, default: '' },
    reservadoEm: { type: Date, default: null },
    enviadoEm: { type: Date, default: null },
}, { timestamps: true })

envioSchema.index({ email: 1, status: 1, enviadoEm: -1 })
envioSchema.index({ status: 1, createdAt: 1 })
envioSchema.index({ tenantId: 1, remetenteId: 1, leadId: 1 })

const EnvioModel = mongoose.models.envios || mongoose.model('envios', envioSchema)

export default EnvioModel
