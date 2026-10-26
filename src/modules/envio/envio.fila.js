import EnvioModel from './envio.model.js'
import RemetenteModel from '../remetente/remetente.model.js'
import LeadModel from '../lead/lead.model.js'
import { cotaDoEmail, inicioDoProximoDia } from './envio.cota.js'
import { enviarPeloGmail, limiteDoGmail, senhaRecusada } from './envio.gmail.js'

// Fila de e-mails para leads: cada Gmail manda um por vez, com 30 a 60 segundos entre um e outro (rajada de
// e-mails é o jeito mais rápido de o Gmail marcar como spam). Passou do limite do dia, o resto espera o dia seguinte.
// Cada envio é reservado de forma atômica (na_fila -> enviando); envio preso em 'enviando' volta para a fila.
const INTERVALO_MS = 5000
const ESPERA_MIN_MS = 30 * 1000
const ESPERA_MAX_MS = 60 * 1000
const PRESO_APOS_MS = 10 * 60 * 1000

const liberadoEm = new Map()
const ocupados = new Set()

function esperar(email, ate) {
    liberadoEm.set(email, ate ?? Date.now() + ESPERA_MIN_MS + Math.random() * (ESPERA_MAX_MS - ESPERA_MIN_MS))
}

async function terminar(envios, campos, lead) {
    const ids = envios.map((e) => e._id)
    const leadIds = envios.map((e) => e.leadId).filter(Boolean)
    await EnvioModel.updateMany({ _id: { $in: ids } }, { $set: campos })
    await LeadModel.updateMany({ _id: { $in: leadIds } }, { $set: { envioPendente: false, ...lead } })
}

async function falhar(envios, erro) {
    await terminar(envios, { status: 'erro', erro }, { envioErro: erro })
}

async function processarProximo(email) {
    const cota = await cotaDoEmail(email)
    if (cota.restante <= 0) return esperar(email, inicioDoProximoDia().getTime())

    const envio = await EnvioModel.findOneAndUpdate(
        { email, status: 'na_fila' },
        { $set: { status: 'enviando', reservadoEm: new Date() } },
        { sort: { createdAt: 1 }, returnDocument: 'after' },
    )
    if (!envio) return

    const remetente = await RemetenteModel.findById(envio.remetenteId)
    if (!remetente?.ativo) return falhar([envio], 'Remetente excluído ou desativado')

    try {
        await enviarPeloGmail(remetente, envio)
    } catch (erro) {
        if (limiteDoGmail(erro)) {
            await EnvioModel.updateOne({ _id: envio._id }, { $set: { status: 'na_fila' } })
            return esperar(email, inicioDoProximoDia().getTime())
        }
        if (senhaRecusada(erro)) {
            // Com a senha recusada, todos os outros deste remetente também falhariam.
            const pendentes = await EnvioModel.find({ remetenteId: remetente._id, status: 'na_fila' }, 'leadId')
            return falhar([envio, ...pendentes], 'A senha de app do Gmail foi recusada')
        }
        esperar(email)
        return falhar([envio], String(erro?.message ?? erro).slice(0, 300))
    }

    const agora = new Date()
    await terminar([envio], { status: 'enviado', enviadoEm: agora, erro: '' }, {
        envioErro: '',
        ultimoEnvioEm: agora,
        ultimoEnvioNegocio: remetente.nomeNegocio,
    })
    // Só avança quem ainda era "novo": não rebaixa lead já interessado ou cliente.
    if (envio.leadId) await LeadModel.updateOne({ _id: envio.leadId, status: 'novo' }, { $set: { status: 'contatado' } })
    esperar(email)
}

export function iniciarFilaDeEnvios(log) {
    async function rodada() {
        await EnvioModel.updateMany(
            { status: 'enviando', reservadoEm: { $lt: new Date(Date.now() - PRESO_APOS_MS) } },
            { $set: { status: 'na_fila' } },
        )
        const emails = await EnvioModel.distinct('email', { status: 'na_fila' })
        for (const email of emails) {
            if (ocupados.has(email) || (liberadoEm.get(email) ?? 0) > Date.now()) continue
            ocupados.add(email)
            processarProximo(email)
                .catch((erro) => log.error(erro, `Falha na fila de envio do Gmail ${email}`))
                .finally(() => ocupados.delete(email))
        }
    }

    setInterval(() => {
        rodada().catch((erro) => log.error(erro, 'Falha na fila de envios'))
    }, INTERVALO_MS)
}
