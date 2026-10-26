// Variáveis que a pessoa pode usar no assunto, no corpo e no rodapé.
const VARIAVEIS = /\{(nome|contato|cidade)\}/g

// Valores de exemplo para o e-mail de teste da tela de remetentes.
export const LEAD_EXEMPLO = { nome: 'Bright Smile Dental', contato: 'John Smith', cidade: 'Austin' }

function escaparHtml(texto) {
    return String(texto ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

function preencher(texto, lead, html) {
    return String(texto ?? '').replace(VARIAVEIS, (trecho, chave) => (html ? escaparHtml(lead?.[chave]) : String(lead?.[chave] ?? '')))
}

// Texto com HTML de bloco (<p>, <div>, <br>...) já diz onde a linha quebra; só no texto simples as quebras viram <br>.
const HTML_DE_BLOCO = /<(p|div|br|table|ul|ol|li|h[1-6])\b/i

function paraHtml(texto, lead) {
    const html = preencher(texto, lead, true)
    return HTML_DE_BLOCO.test(html) ? html : html.replace(/\r?\n/g, '<br>')
}

export function montarAssunto(assunto, lead) {
    return preencher(assunto, lead, false).replace(/\s+/g, ' ').trim()
}

export function montarCorpo(corpo, rodape, lead) {
    const html = paraHtml(corpo, lead)
    if (!String(rodape ?? '').trim()) return html
    return `${html}<br><br><div style="font-size:12px;line-height:1.5;color:#6b7280">${paraHtml(rodape, lead)}</div>`
}
