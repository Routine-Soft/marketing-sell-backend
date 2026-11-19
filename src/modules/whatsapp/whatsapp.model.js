import mongoose from 'mongoose'

// WhatsApp de cada negócio, conectado pela Evolution API (ver evolution.client.js), e a regra do envio automático
// para os leads (ver whatsapp.fila.js). Mensagens recebidas não passam pelo sistema: a resposta chega no celular.
export const TEXTO_PADRAO = 'Olá, {contato}! Tudo bem? Vi a {nome} aqui em {cidade} e queria te apresentar um trabalho que pode ajudar. Posso te mandar mais detalhes?'

const whatsappSchema = new mongoose.Schema({
    // Negócio dono da conexão (um WhatsApp por negócio).
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'negocios', required: true, unique: true },
    // Nome da conexão na Evolution.
    instancia: { type: String, required: true },
    numero: { type: String, default: null },
    nomePerfil: { type: String, default: null },
    conectadoEm: { type: Date, default: null },

    // Regra do envio automático: ligado, texto, situações e fontes dos leads (vazio = todas), quantos por dia,
    // janela de horário (Brasília, hora cheia: das `horaInicio` até antes das `horaFim`) e dias da semana (0 = domingo).
    ativo: { type: Boolean, default: false },
    texto: { type: String, default: TEXTO_PADRAO, maxlength: 1000 },
    situacoes: { type: [String], default: ['novo'] },
    fontes: { type: [String], default: [] },
    limiteDiario: { type: Number, default: 30 },
    horaInicio: { type: Number, default: 9 },
    horaFim: { type: Number, default: 18 },
    dias: { type: [Number], default: [1, 2, 3, 4, 5] },

    // Quando pode sair a próxima mensagem (as mensagens são espalhadas pela janela, ver whatsapp.fila.js).
    proximoEnvioEm: { type: Date, default: null },
    // Último problema da fila (WhatsApp desconectado, recusa do serviço...), mostrado na tela.
    ultimoErro: { type: String, default: '' },
    ultimoErroEm: { type: Date, default: null },
}, { timestamps: true })

const WhatsappModel = mongoose.models.whatsapp_negocios || mongoose.model('whatsapp_negocios', whatsappSchema)

export default WhatsappModel
