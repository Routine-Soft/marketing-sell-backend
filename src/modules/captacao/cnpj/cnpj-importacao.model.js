import mongoose from 'mongoose'

// Uma por competência (mês da base da Receita): evita importar duas vezes e mostra na tela de onde vêm os dados.
const importacaoSchema = new mongoose.Schema({
    _id: { type: String }, // 'AAAA-MM'
    status: { type: String, enum: ['importando', 'concluida', 'erro'], default: 'importando' },
    iniciadaEm: { type: Date, default: Date.now },
    concluidaEm: { type: Date, default: null },
    estabelecimentos: { type: Number, default: 0 },
    // Atividades (CNAE) que esta importação trouxe; atividade escolhida depois entra na próxima madrugada.
    cnaes: { type: [String], default: [] },
    erro: { type: String, default: '' },
}, { timestamps: true, _id: false })

const CnpjImportacaoModel = mongoose.models.cnpjimportacoes || mongoose.model('cnpjimportacoes', importacaoSchema)

export default CnpjImportacaoModel
