import { mandarLembretes } from './follow-up.lembrete.js'
import { enfileirarFollowUps } from './follow-up.email.js'
import { detectarRespostas } from './follow-up.respostas.js'

const MINUTO = 60 * 1000

// Sobe com o servidor: lembrete do Telegram (confere a cada minuto, manda uma vez por dia), follow-up automático
// por e-mail e leitura de respostas (a cada 10 minutos). Uma rodada só começa quando a anterior terminou.
export function iniciarFollowUp(log) {
    function repetir(nome, tarefa, intervalo) {
        let rodando = false
        setInterval(async () => {
            if (rodando) return
            rodando = true
            try {
                await tarefa()
            } catch (erro) {
                log.error(erro, `Falha em: ${nome}`)
            } finally {
                rodando = false
            }
        }, intervalo)
    }

    repetir('lembrete de follow-up no Telegram', mandarLembretes, MINUTO)
    repetir('follow-up automático por e-mail', enfileirarFollowUps, 10 * MINUTO)
    repetir('leitura de respostas dos leads', () => detectarRespostas(log), 10 * MINUTO)
}
