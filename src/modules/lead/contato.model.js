import mongoose from 'mongoose'

export const CANAIS_CONTATO = ['ligacao', 'whatsapp', 'email', 'dm', 'visita']

// Cada vez que a conta falou com o lead (ligação, WhatsApp, e-mail...). É a base das contagens da rotina e do
// painel: "primeiros contatos no dia" e "follow-ups feitos no dia".
const contatoSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'leads', required: true },
    canal: { type: String, enum: CANAIS_CONTATO, required: true },
    // 1 = primeiro contato; 2, 3 e 4 = follow-ups.
    numero: { type: Number, required: true },
    // Saiu sozinho (e-mail de follow-up automático) ou foi a pessoa que registrou.
    automatico: { type: Boolean, default: false },
    em: { type: Date, required: true },
}, { timestamps: true })

contatoSchema.index({ tenantId: 1, em: -1 })
contatoSchema.index({ leadId: 1 })

const ContatoModel = mongoose.models.contatos || mongoose.model('contatos', contatoSchema)

export default ContatoModel
