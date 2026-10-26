import mongoose from 'mongoose'

const remetenteSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },

    // Nome interno pra identificar o negócio (ex.: "Sonélia", "Stanley Andrade"). Único dentro da conta.
    nomeNegocio: { type: String, required: true },
    // Nome que aparece como remetente no e-mail (From). Default = nomeNegocio.
    nomeExibicao: { type: String, required: true },

    // E-mail usado para autenticar e enviar via SMTP do Gmail. Precisa de senha de app (verificação em 2 etapas ativada).
    email: {
        type: String,
        required: true,
        lowercase: true,
        set: (valor) => (typeof valor === 'string' ? valor.replace(/\s+/g, '') : valor),
    },
    // Senha de app do Gmail, sempre guardada criptografada (ver shared/utils/criptografia.js).
    senhaApp: { type: String, required: true },

    assuntoPadrao: { type: String, default: '' },
    corpoPadrao: { type: String, default: '' },
    // Vai no fim de todo e-mail: a lei dos EUA (CAN-SPAM) pede endereço físico e um jeito de pedir para não receber mais.
    rodape: { type: String, default: '' },

    ativo: { type: Boolean, default: true },
}, { timestamps: true })

remetenteSchema.index({ tenantId: 1, nomeNegocio: 1 }, { unique: true })

remetenteSchema.methods.toJSON = function () {
    const obj = this.toObject()
    delete obj.senhaApp
    return obj
}

const RemetenteModel = mongoose.models.remetentes || mongoose.model('remetentes', remetenteSchema)

export default RemetenteModel
