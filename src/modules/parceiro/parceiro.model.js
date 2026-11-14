import mongoose from 'mongoose'

export const TIPOS_PARCEIRO = ['contador', 'influenciador', 'vendedor', 'outro']
export const STATUS_PARCEIRO = ['listado', 'contatado', 'respondeu', 'em_conversa', 'parceiro_ativo', 'sem_interesse']

// Parceiro que indica clientes (contador, influenciador, vendedor autônomo). É a aba "Parceiros" da planilha.
const parceiroSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    nome: { type: String, required: true },
    tipo: { type: String, enum: TIPOS_PARCEIRO, default: 'contador' },
    // Telefone, e-mail ou @ da rede social.
    contato: { type: String, default: '' },
    canal: { type: String, default: '' },
    primeiroContatoEm: { type: Date, default: null },
    status: { type: String, enum: STATUS_PARCEIRO, default: 'listado' },
    comissao: { type: String, default: '' },
    linkRastreavel: { type: String, default: '' },
    observacao: { type: String, default: '' },
}, { timestamps: true })

parceiroSchema.index({ tenantId: 1, createdAt: -1 })

const ParceiroModel = mongoose.models.parceiros || mongoose.model('parceiros', parceiroSchema)

export default ParceiroModel
