import { ImapFlow } from 'imapflow'
import RemetenteModel from '../remetente/remetente.model.js'
import LeadModel, { SEM_RESPOSTA } from '../lead/lead.model.js'
import { negocioComDono } from '../negocio/negocio.contas.js'
import { pararFollowUp } from '../lead/lead.contato.js'
import { RotinaService } from '../rotina/rotina.service.js'
import { descriptografar } from '../shared/utils/criptografia.js'
import { avisarNoTelegram, chatDoTelegram } from '../shared/utils/telegram.js'

const JANELA_MS = 3 * 24 * 60 * 60 * 1000

// Quem escreveu para este Gmail nos últimos dias: e-mail de quem mandou -> data da mensagem mais recente.
// Lê só o cabeçalho (remetente e data) da caixa de entrada, com a mesma senha de app usada para enviar.
async function quemEscreveu(remetente) {
    const cliente = new ImapFlow({
        host: 'imap.gmail.com',
        port: 993,
        secure: true,
        auth: { user: remetente.email, pass: descriptografar(remetente.senhaApp) },
        logger: false,
    })
    cliente.on('error', () => {})
    const recebidos = new Map()
    await cliente.connect()
    try {
        const trava = await cliente.getMailboxLock('INBOX', { readOnly: true })
        try {
            for await (const mensagem of cliente.fetch({ since: new Date(Date.now() - JANELA_MS) }, { envelope: true, internalDate: true })) {
                const de = String(mensagem.envelope?.from?.[0]?.address ?? '').toLowerCase()
                const quando = mensagem.internalDate ?? mensagem.envelope?.date
                if (de && quando && (recebidos.get(de) ?? 0) < quando) recebidos.set(de, quando)
            }
        } finally {
            trava.release()
        }
    } finally {
        await cliente.logout().catch(() => {})
    }
    return recebidos
}

// Lead que respondeu o e-mail: vira "respondeu", sai do follow-up (os automáticos param) e a conta é avisada no Telegram.
export async function detectarRespostas(log) {
    const remetentes = await RemetenteModel.find({ ativo: true })
    const porGmail = new Map()
    for (const remetente of remetentes) {
        if (!porGmail.has(remetente.email)) porGmail.set(remetente.email, { remetente, contas: new Set() })
        porGmail.get(remetente.email).contas.add(String(remetente.tenantId))
    }

    for (const [email, { remetente, contas }] of porGmail) {
        let recebidos
        try {
            recebidos = await quemEscreveu(remetente)
        } catch (erro) {
            log.warn(`Não foi possível ler as respostas do Gmail ${email}: ${erro?.responseText ?? erro?.message ?? erro}`)
            continue
        }
        if (!recebidos.size) continue

        const leads = await LeadModel.find({
            tenantId: { $in: [...contas] },
            email: { $in: [...recebidos.keys()] },
            status: { $in: SEM_RESPOSTA },
            ultimoEnvioEm: { $ne: null },
        })
        for (const lead of leads) {
            const quando = recebidos.get(lead.email)
            if (quando <= (lead.primeiroContatoEm ?? lead.ultimoEnvioEm)) continue
            lead.status = 'respondeu'
            await pararFollowUp(lead, quando)
            await lead.save()
            await RotinaService.sincronizarHoje(lead.tenantId)
            const { negocio, dono } = await negocioComDono(lead.tenantId)
            avisarNoTelegram(chatDoTelegram(dono), `📩 ${lead.nome} respondeu o seu e-mail${negocio ? ` (${negocio.nome})` : ''}!\n${lead.email}${lead.telefone ? ` • ${lead.telefone}` : ''}\nOs follow-ups automáticos pararam: agora a resposta é sua.`)
        }
    }
}
