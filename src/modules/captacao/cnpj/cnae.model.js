import mongoose from 'mongoose'

// Lista oficial de atividades (CNAE subclasse) da Receita, para a pessoa achar a atividade pelo nome.
const cnaeSchema = new mongoose.Schema({
    _id: { type: String }, // 7 dígitos
    descricao: { type: String, required: true },
    // Descrição em minúsculas e sem acento, para a busca.
    busca: { type: String, required: true },
}, { _id: false })

const CnaeModel = mongoose.models.cnaes || mongoose.model('cnaes', cnaeSchema)

export default CnaeModel

export function semAcento(texto) {
    return String(texto ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}
