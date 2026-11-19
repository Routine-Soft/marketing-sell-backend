import mongoose from 'mongoose'

// Cada mensagem de WhatsApp que saiu (ou falhou) para um lead, ou um teste. É a base da contagem do dia e da lista
// "Últimos envios" da tela.
const whatsappEnvioSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'negocios', required: true },
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'leads', default: null },
    nome: { type: String, default: '' },
    numero: { type: String, default: '' },
    texto: { type: String, default: '' },
    status: { type: String, enum: ['enviado', 'erro'], required: true },
    erro: { type: String, default: '' },
    teste: { type: Boolean, default: false },
}, { timestamps: true })

whatsappEnvioSchema.index({ tenantId: 1, createdAt: -1 })

const WhatsappEnvioModel = mongoose.models.whatsapp_envios || mongoose.model('whatsapp_envios', whatsappEnvioSchema)

export default WhatsappEnvioModel
