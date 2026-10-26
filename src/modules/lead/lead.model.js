import mongoose from 'mongoose'

export const LEAD_STATUS = ['novo', 'contatado', 'interessado', 'cliente', 'descartado']

// Situação da busca de e-mail no site do lead (ver módulo email-site).
export const EMAIL_STATUS = ['nao_buscado', 'na_fila', 'buscando', 'encontrado', 'nao_encontrado', 'sem_site']

const leadSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    // De onde veio: 'npi', 'google', 'empresas_novas', 'licencas' (ver captacao/fontes).
    fonte: { type: String, required: true },
    // Identificador na fonte (número NPI, place id do Google, registro na Secretaria de Estado, licença).
    // Com o tenantId e a fonte, impede o mesmo lead duas vezes na conta.
    idExterno: { type: String, required: true },
    buscaId: { type: mongoose.Schema.Types.ObjectId, ref: 'buscas', default: null },

    nome: { type: String, required: true },
    // Pessoa ligada ao lead quando o nome é de uma empresa (sócio, dono da licença).
    contato: { type: String, default: '' },
    categoria: { type: String, default: '' },
    telefone: { type: String, default: '' },
    email: { type: String, default: '' },
    emailStatus: { type: String, enum: EMAIL_STATUS, default: 'nao_buscado' },
    emailBuscaEm: { type: Date, default: null },
    site: { type: String, default: '' },
    endereco: { type: String, default: '' },
    cidade: { type: String, default: '' },
    estado: { type: String, default: '' },
    cep: { type: String, default: '' },
    // Dados próprios de cada fonte (número da licença, tipo de empresa, data de abertura...).
    extras: { type: mongoose.Schema.Types.Mixed, default: {} },

    // E-mail para o lead (ver módulo envio): esperando na fila, último que saiu e de qual negócio, e a última falha.
    envioPendente: { type: Boolean, default: false },
    ultimoEnvioEm: { type: Date, default: null },
    ultimoEnvioNegocio: { type: String, default: '' },
    envioErro: { type: String, default: '' },

    status: { type: String, enum: LEAD_STATUS, default: 'novo' },
    observacao: { type: String, default: '' },
}, { timestamps: true, minimize: false })

leadSchema.index({ tenantId: 1, fonte: 1, idExterno: 1 }, { unique: true })
leadSchema.index({ tenantId: 1, createdAt: -1 })
leadSchema.index({ emailStatus: 1, emailBuscaEm: 1 })

const LeadModel = mongoose.models.leads || mongoose.model('leads', leadSchema)

export default LeadModel
