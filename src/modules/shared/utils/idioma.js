import { MENSAGENS_EN } from './mensagens.en.js'
import { MENSAGENS_ES } from './mensagens.es.js'

const MENSAGENS = { en: MENSAGENS_EN, es: MENSAGENS_ES }

// O site manda "Accept-Language: en" ou "es" quando a pessoa usa a Marketing Sell em inglês ou espanhol. O código e
// as mensagens ficam em português; a tradução acontece na saída (ver o onSend em index.js).
export function idiomaDaRequisicao(req) {
    const pedido = String(req.headers['accept-language'] ?? '').toLowerCase().slice(0, 2)
    return MENSAGENS[pedido] ? pedido : 'pt'
}

// Mensagens com partes variáveis ({0}, {1}...) viram expressões: "Repasse de {0} pago" casa com "Repasse de R$ 50 pago".
function modelosDe(mensagens) {
    return Object.entries(mensagens)
        .filter(([pt]) => /\{\d+\}/.test(pt))
        .map(([pt, traducao]) => {
            const partes = pt.split(/\{\d+\}/).map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
            const ordem = [...pt.matchAll(/\{(\d+)\}/g)].map((m) => Number(m[1]))
            return { regex: new RegExp(`^${partes.join('(.+?)')}$`, 's'), ordem, traducao }
        })
        // modelos mais específicos (mais texto fixo) primeiro
        .sort((a, b) => b.regex.source.length - a.regex.source.length)
}

const MODELOS = { en: modelosDe(MENSAGENS_EN), es: modelosDe(MENSAGENS_ES) }

// Quanto de português sobrou numa tradução (acentos e palavras comuns), para escolher o melhor modelo.
function restoEmPortugues(texto) {
    return (texto.match(/[ãõçáéíóúâêô]|\b(?:de|do|da|e|só|um|uma|não|para|com|os|as|hoje|são|deixe|remova)\b/gi) ?? []).length
}

export function traduzirMensagem(mensagem, idioma, profundidade = 0) {
    const mensagens = MENSAGENS[idioma]
    if (!mensagens || typeof mensagem !== 'string' || !mensagem) return mensagem
    if (mensagens[mensagem]) return mensagens[mensagem]
    if (profundidade > 2) return mensagem
    // Mais de um modelo pode casar (um pedaço variável pode "engolir" o resto da frase): fica o que deixa menos
    // texto sem traduzir nas partes variáveis.
    let melhor = null
    for (const { regex, ordem, traducao: modelo } of MODELOS[idioma]) {
        const m = mensagem.match(regex)
        if (!m) continue
        const valores = {}
        ordem.forEach((n, i) => { valores[n] = traduzirMensagem(m[i + 1], idioma, profundidade + 1) })
        const traducao = modelo.replace(/\{(\d+)\}/g, (trecho, n) => valores[n] ?? trecho)
        const sobra = restoEmPortugues(traducao)
        if (!melhor || sobra < melhor.sobra) melhor = { sobra, traducao }
        if (sobra === 0) break
    }
    return melhor ? melhor.traducao : mensagem
}
