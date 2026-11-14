import mongoose from 'mongoose'

// Estabelecimentos abertos recentemente nas atividades (CNAE) que os negócios escolheram, tirados da base aberta de
// CNPJs da Receita Federal (importada uma vez por mês, ver cnpj.importar.js). É uma base do sistema, igual para todas
// as contas: a fonte "cnpj" da captação busca aqui e copia para os leads de cada negócio.
const cnpjSchema = new mongoose.Schema({
    // CNPJ com os 14 dígitos.
    _id: { type: String },
    // 8 primeiros dígitos: ligam o estabelecimento à empresa (razão social).
    basico: { type: String, required: true },
    fantasia: { type: String, default: '' },
    razaoSocial: { type: String, default: '' },
    cnae: { type: String, required: true },
    // 'AAAA-MM-DD'
    abertura: { type: String, required: true },
    uf: { type: String, default: '' },
    municipio: { type: String, default: '' },
    bairro: { type: String, default: '' },
    endereco: { type: String, default: '' },
    cep: { type: String, default: '' },
    telefone: { type: String, default: '' },
    telefone2: { type: String, default: '' },
    email: { type: String, default: '' },
    // Competência (mês da base) em que apareceu pela última vez; o que sumiu da base é apagado.
    competencia: { type: String, required: true },
}, { timestamps: true, _id: false })

cnpjSchema.index({ cnae: 1, uf: 1, abertura: -1 })
cnpjSchema.index({ basico: 1 })
cnpjSchema.index({ competencia: 1 })

const CnpjModel = mongoose.models.cnpjs || mongoose.model('cnpjs', cnpjSchema)

export default CnpjModel
