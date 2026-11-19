import LeadModel from '../lead/lead.model.js'
import NegocioModel from '../negocio/negocio.model.js'
import WhatsappModel from './whatsapp.model.js'
import WhatsappEnvioModel from './whatsapp-envio.model.js'
import { Evolution, evolutionConfigurada } from './evolution.client.js'
import { montarTexto, telefoneDoLead } from './whatsapp.texto.js'
import { enviadosHoje, proximoLeadDaRegra } from './whatsapp.regra.js'
import { registrarContato } from '../lead/lead.contato.js'
import { diaDaSemana, diaDe } from '../shared/utils/dia.js'

// Envio automático de WhatsApp para os leads, pela regra de cada negócio (ver whatsapp.model.js):
//  - confere a cada minuto e manda no máximo UMA mensagem por negócio por vez;
//  - só nos dias e na janela de horário escolhidos, até a quantidade do dia;
//  - as mensagens são espalhadas pela janela (tempo que falta ÷ mensagens que faltam, com uma variação),
//    nunca menos de 90 segundos entre uma e outra, para o WhatsApp não tratar o número como robô;
//  - cada lead recebe uma vez só; número sem WhatsApp fica marcado e não é tentado de novo;
//  - a mensagem conta como contato (canal WhatsApp): "novo" vira "contatado" e entra no follow-up.
const MINUTO = 60 * 1000
const MINIMO_ENTRE_MENSAGENS = 1.5 * MINUTO
const MAXIMO_ENTRE_MENSAGENS = 45 * MINUTO

const SEM_WHATSAPP = 'Este número não tem WhatsApp'

// Minutos desde a meia-noite de Brasília.
function minutosAgora(agora = new Date()) {
    const brasilia = new Date(agora.getTime() - 3 * 60 * MINUTO)
    return brasilia.getUTCHours() * 60 + brasilia.getUTCMinutes()
}

export function dentroDaJanela(config, agora = new Date()) {
    const minutos = minutosAgora(agora)
    return config.dias.includes(diaDaSemana(diaDe(agora))) && minutos >= config.horaInicio * 60 && minutos < config.horaFim * 60
}

function espera(config, faltam, agora = new Date()) {
    const restante = (config.horaFim * 60 - minutosAgora(agora)) * MINUTO
    const media = faltam > 0 ? restante / faltam : MAXIMO_ENTRE_MENSAGENS
    const comVariacao = media * (0.6 + Math.random() * 0.8)
    return Math.min(MAXIMO_ENTRE_MENSAGENS, Math.max(MINIMO_ENTRE_MENSAGENS, comVariacao))
}

async function adiar(config, ms, erro) {
    config.proximoEnvioEm = new Date(Date.now() + ms)
    if (erro !== undefined) {
        config.ultimoErro = erro
        config.ultimoErroEm = erro ? new Date() : null
    }
    await config.save()
}

async function enviarParaUmLead(config) {
    const jaForam = await enviadosHoje(config.tenantId)
    if (jaForam >= config.limiteDiario) return

    const lead = await proximoLeadDaRegra(config)
    if (!lead) return

    if ((await Evolution.estado(config.instancia).catch(() => null)) !== 'open') {
        await adiar(config, 10 * MINUTO, 'O WhatsApp está desconectado. Conecte de novo para os envios continuarem.')
        return
    }

    // Reserva o lead antes de enviar: ele não é escolhido de novo, mesmo se o servidor reiniciar no meio.
    const reserva = await LeadModel.updateOne({ _id: lead._id, whatsappEm: null }, { $set: { whatsappEm: new Date(), whatsappErro: '' } })
    if (reserva.modifiedCount === 0) return

    const negocio = await NegocioModel.findById(config.tenantId, 'nome').lean()
    const texto = montarTexto(config.texto, lead, negocio?.nome ?? '')
    const numero = telefoneDoLead(lead.telefone, lead.fonte)
    const registro = { tenantId: config.tenantId, leadId: lead._id, nome: lead.nome, numero: numero ?? lead.telefone, texto }

    if (!numero) {
        await LeadModel.updateOne({ _id: lead._id }, { $set: { whatsappErro: 'Telefone inválido para WhatsApp' } })
        await WhatsappEnvioModel.create({ ...registro, status: 'erro', erro: 'Telefone inválido para WhatsApp' })
        await adiar(config, 0)
        return
    }

    try {
        await Evolution.enviarTexto(config.instancia, numero, texto)
    } catch (erro) {
        if (erro.message === SEM_WHATSAPP) {
            await LeadModel.updateOne({ _id: lead._id }, { $set: { whatsappErro: SEM_WHATSAPP } })
            await WhatsappEnvioModel.create({ ...registro, status: 'erro', erro: SEM_WHATSAPP })
            await adiar(config, MINUTO)
            return
        }
        // Problema do serviço ou da conexão: o lead volta para a fila e o negócio espera 10 minutos.
        await LeadModel.updateOne({ _id: lead._id }, { $set: { whatsappEm: null } })
        await adiar(config, 10 * MINUTO, erro.message)
        return
    }

    await WhatsappEnvioModel.create({ ...registro, status: 'enviado' })
    const atualizado = await LeadModel.findById(lead._id)
    if (atualizado) await registrarContato(atualizado, 'whatsapp', { automatico: true })
    await adiar(config, espera(config, config.limiteDiario - jaForam - 1), '')
}

export async function processarWhatsapp(agora = new Date()) {
    const configs = await WhatsappModel.find({ ativo: true, $or: [{ proximoEnvioEm: null }, { proximoEnvioEm: { $lte: agora } }] })
    for (const config of configs) {
        if (dentroDaJanela(config, agora)) await enviarParaUmLead(config)
    }
}

// Sobe com o servidor. Sem a Evolution API configurada (EVOLUTION_API_URL e EVOLUTION_API_KEY), não faz nada.
export function iniciarFilaDeWhatsapp(log) {
    if (!evolutionConfigurada()) {
        log.info('Evolution API não configurada: envio automático de WhatsApp desligado')
        return
    }
    let rodando = false
    setInterval(async () => {
        if (rodando) return
        rodando = true
        try {
            await processarWhatsapp()
        } catch (erro) {
            log.error(erro, 'Falha no envio automático de WhatsApp')
        } finally {
            rodando = false
        }
    }, MINUTO).unref()
}
