import EnvioModel from './envio.model.js'
import PausaGmailModel from './pausa-gmail.model.js'

// O limite de 500/dia é da própria Google (SMTP de conta Gmail comum): vale por Gmail, não por conta do sistema.
export function limiteDiarioGmail() {
    const valor = Number.parseInt(process.env.GMAIL_LIMITE_DIARIO, 10)
    return Number.isFinite(valor) && valor > 0 ? valor : 500
}

export function inicioDoDia(data = new Date()) {
    return new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate()))
}

export function inicioDoProximoDia() {
    return new Date(inicioDoDia().getTime() + 24 * 60 * 60 * 1000)
}

export async function cotaDoEmail(email) {
    const limite = limiteDiarioGmail()
    const [usado, naFila, pausa] = await Promise.all([
        EnvioModel.countDocuments({ email, status: 'enviado', enviadoEm: { $gte: inicioDoDia() } }),
        EnvioModel.countDocuments({ email, status: { $in: ['na_fila', 'enviando'] } }),
        pausaDoGmail(email),
    ])
    return {
        limite,
        usado,
        restante: Math.max(0, limite - usado),
        naFila,
        pausadoAte: pausa?.ate ?? null,
        pausaResposta: pausa?.resposta ?? '',
        pausadoEm: pausa?.updatedAt ?? null,
    }
}

// Pausa ainda valendo (o Gmail recusou por limite), ou null.
export async function pausaDoGmail(email) {
    return PausaGmailModel.findOne({ email, ate: { $gt: new Date() } }).lean()
}

export async function pausarGmail(email, resposta) {
    const ate = inicioDoProximoDia()
    await PausaGmailModel.updateOne({ email }, { $set: { ate, resposta: String(resposta ?? '').slice(0, 500) } }, { upsert: true })
    return ate
}
