// Avisos pelo Telegram (bot criado no @BotFather), pela API HTTP: sem SDK. Mesmo bot do Sonelia.
// TELEGRAM_BOT_TOKEN: token do bot. O destino é a conversa da conta (ver chatDoTelegram).
// Sem token ou sem conversa, o aviso é ignorado; se o Telegram falhar, o erro fica só no log (nunca trava quem chamou).
const LIMITE_TELEGRAM = 4000

export function avisarNoTelegram(chatId, texto) {
    const { TELEGRAM_BOT_TOKEN } = process.env
    if (!TELEGRAM_BOT_TOKEN || !chatId) return

    fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: String(texto).slice(0, LIMITE_TELEGRAM), disable_web_page_preview: true }),
    })
        .then(async (resposta) => {
            if (!resposta.ok) console.error(`Telegram recusou o aviso (${resposta.status}): ${await resposta.text().catch(() => '')}`)
        })
        .catch((error) => console.error(`Não foi possível mandar o aviso pelo Telegram: ${error.message}`))
}

// Conversa que recebe os avisos da conta: a que o dono informou em "Minha conta". O super admin (Stanley), sem
// nada informado, cai na conversa do .env (TELEGRAM_CHAT_ID), a mesma que já recebe os alertas do Sonelia.
export function chatDoTelegram(dono) {
    if (dono?.telegramChatId) return dono.telegramChatId
    return dono?.role === 'super_admin' ? (process.env.TELEGRAM_CHAT_ID ?? '') : ''
}
