import mongoose from 'mongoose'

// novo -> contatado -> respondeu -> interessado -> demo -> teste_gratis -> cliente; descartado = perdido.
export const LEAD_STATUS = ['novo', 'contatado', 'respondeu', 'interessado', 'demo', 'teste_gratis', 'cliente', 'descartado']
// Situações em que o lead ainda não respondeu: só nelas existe follow-up.
export const SEM_RESPOSTA = ['novo', 'contatado']

// Situação da busca de e-mail no site do lead (ver módulo email-site).
export const EMAIL_STATUS = ['nao_buscado', 'na_fila', 'buscando', 'encontrado', 'nao_encontrado', 'sem_site']

const leadSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    // De onde veio: 'npi', 'google', 'empresas_novas', 'licencas' (ver captacao/fontes) ou 'manual' (cadastrado à mão).
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
    instagram: { type: String, default: '' },
    // De onde o lead veio quando foi cadastrado à mão (Instagram, Doctoralia, indicação...).
    origem: { type: String, default: '' },
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

    // Contatos com o lead (ver lead.contato.js): o follow-up é 3, 7 e 14 dias depois do primeiro contato.
    primeiroContatoEm: { type: Date, default: null },
    canalPrimeiroContato: { type: String, default: '' },
    ultimoContatoEm: { type: Date, default: null },
    numeroContatos: { type: Number, default: 0 },
    proximoFollowUpEm: { type: Date, default: null },
    respondeuEm: { type: Date, default: null },

    status: { type: String, enum: LEAD_STATUS, default: 'novo' },
    observacao: { type: String, default: '' },
}, { timestamps: true, minimize: false })

leadSchema.index({ tenantId: 1, fonte: 1, idExterno: 1 }, { unique: true })
leadSchema.index({ tenantId: 1, createdAt: -1 })
leadSchema.index({ emailStatus: 1, emailBuscaEm: 1 })
leadSchema.index({ tenantId: 1, proximoFollowUpEm: 1 })

const LeadModel = mongoose.models.leads || mongoose.model('leads', leadSchema)

export default LeadModel
