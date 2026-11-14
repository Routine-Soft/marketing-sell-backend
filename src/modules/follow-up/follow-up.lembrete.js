import UserModel from '../user/user.model.js'
import LeadModel from '../lead/lead.model.js'
import AvisoModel from './aviso.model.js'
import { filtroFollowUp, leadsComFollowUpVencido } from '../lead/lead.contato.js'
import { RotinaService } from '../rotina/rotina.service.js'
import { avisarNoTelegram, chatDoTelegram } from '../shared/utils/telegram.js'
import { diaDe, diaUtil, fimDoDia, horaAgora } from '../shared/utils/dia.js'

const HORA_DO_LEMBRETE = 8
const MAXIMO_NA_MENSAGEM = 25

function linhaDoLead(lead) {
    const onde = [lead.cidade, lead.estado].filter(Boolean).join('/')
    const contato = lead.telefone || lead.email || 'sem telefone'
    return `${lead.numeroContatos + 1}º contato • ${lead.nome}${onde ? ` (${onde})` : ''} • ${contato}`
}

function textoDoLembrete(vencidos, paraEncerrar) {
    const linhas = ['☀️ Bom dia! Rotina de hoje no Marketing Sell.', '']
    if (vencidos.length) {
        linhas.push(`📞 ${vencidos.length} follow-up(s) para hoje:`)
        vencidos.slice(0, MAXIMO_NA_MENSAGEM).forEach((lead) => linhas.push(`• ${linhaDoLead(lead)}`))
        if (vencidos.length > MAXIMO_NA_MENSAGEM) linhas.push(`… e mais ${vencidos.length - MAXIMO_NA_MENSAGEM} na lista de leads.`)
    } else {
        linhas.push('✅ Nenhum follow-up vencido hoje.')
    }
    if (paraEncerrar) linhas.push('', `🗂 ${paraEncerrar} lead(s) com 4 contatos sem resposta: encerre ou tente outro canal.`)
    linhas.push('', 'Dia ruim? Faça o mínimo: 10 contatos novos e 3 follow-ups.')
    return linhas.join('\n')
}

// Uma vez por dia útil, a partir das 8h (Brasília): manda no Telegram de cada conta quem está com follow-up vencido.
export async function mandarLembretes() {
    const dia = diaDe()
    if (!diaUtil(dia) || horaAgora() < HORA_DO_LEMBRETE || !process.env.TELEGRAM_BOT_TOKEN) return

    const donos = await UserModel.find({ role: { $in: ['admin', 'super_admin'] }, $expr: { $eq: ['$_id', '$tenantId'] } })
    for (const dono of donos) {
        const chat = chatDoTelegram(dono)
        if (!chat) continue
        try {
            await AvisoModel.create({ tenantId: dono._id, tipo: 'lembrete_follow_up', dia })
        } catch (erro) {
            if (erro.code === 11000) continue
            throw erro
        }
        const [vencidos, paraEncerrar] = await Promise.all([
            leadsComFollowUpVencido(dono._id, fimDoDia(dia)),
            LeadModel.countDocuments({ tenantId: dono._id, ...filtroFollowUp('encerrar') }),
        ])
        await RotinaService.sincronizarHoje(dono._id)
        avisarNoTelegram(chat, textoDoLembrete(vencidos, paraEncerrar))
    }
}
