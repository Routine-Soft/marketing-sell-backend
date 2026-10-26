import LeadModel from '../lead/lead.model.js'
import { encontrarEmailNoSite } from './email-site.extrator.js'

// Processador da fila de e-mails: pega os leads 'na_fila' (os mais antigos primeiro), alguns ao mesmo tempo.
// Cada lead é "reservado" de forma atômica (na_fila -> buscando), então dois servidores ligados no mesmo
// banco não repetem o trabalho. Lead preso em 'buscando' por muito tempo (servidor caiu) volta para a fila.
const SIMULTANEOS = 4
const INTERVALO_MS = 3000
const PRESO_APOS_MS = 10 * 60 * 1000

async function reservarProximo() {
    return await LeadModel.findOneAndUpdate(
        { emailStatus: 'na_fila' },
        { $set: { emailStatus: 'buscando', emailBuscaEm: new Date() } },
        { sort: { emailBuscaEm: 1 }, new: true },
    )
}

async function processar(lead, log) {
    let email = ''
    try {
        email = await encontrarEmailNoSite(lead.site)
    } catch (erro) {
        log.error(erro, `Falha ao procurar e-mail no site ${lead.site}`)
    }
    await LeadModel.updateOne(
        { _id: lead._id, emailStatus: 'buscando' },
        { $set: email ? { email, emailStatus: 'encontrado' } : { emailStatus: 'nao_encontrado' } },
    )
}

export function iniciarFilaDeEmails(log) {
    let trabalhando = 0

    async function rodada() {
        await LeadModel.updateMany(
            { emailStatus: 'buscando', emailBuscaEm: { $lt: new Date(Date.now() - PRESO_APOS_MS) } },
            { $set: { emailStatus: 'na_fila' } },
        )
        while (trabalhando < SIMULTANEOS) {
            const lead = await reservarProximo()
            if (!lead) break
            trabalhando++
            processar(lead, log).finally(() => { trabalhando-- })
        }
    }

    setInterval(() => {
        rodada().catch((erro) => log.error(erro, 'Falha na fila de e-mails'))
    }, INTERVALO_MS)
}
