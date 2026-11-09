import mongoose from 'mongoose'

// Quando o próprio Gmail recusa por limite de envio, a fila daquele Gmail pausa até `ate`.
// Fica no banco (e não só na memória) para valer mesmo depois de o servidor reiniciar e para a tela mostrar o motivo.
// Vale por Gmail, como a cota: dois negócios no mesmo Gmail pausam juntos.
const pausaGmailSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    ate: { type: Date, required: true },
    // Resposta do Gmail, como veio (em inglês), para conferir o que aconteceu.
    resposta: { type: String, default: '' },
}, { timestamps: true })

const PausaGmailModel = mongoose.models.pausas_gmail || mongoose.model('pausas_gmail', pausaGmailSchema)

export default PausaGmailModel
