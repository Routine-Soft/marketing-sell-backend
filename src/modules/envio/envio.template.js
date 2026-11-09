// Variáveis que a pessoa pode usar no assunto, no corpo e no rodapé.
const VARIAVEIS = /\{(nome|contato|cidade|estado)\}/g

// Valores de exemplo para o e-mail de teste da tela de remetentes.
export const LEAD_EXEMPLO = { nome: 'Bright Smile Dental', contato: 'John Smith', cidade: 'Austin', estado: 'TX' }

// {estado} sai por extenso ("CT" vira "Connecticut"); sigla desconhecida fica como veio.
const NOMES_ESTADOS = {
    AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware',
    DC: 'Washington, DC', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
    KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota',
    MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
    NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon',
    PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah',
    VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
}

function valorDaVariavel(lead, chave) {
    const valor = lead?.[chave]
    return chave === 'estado' ? (NOMES_ESTADOS[String(valor ?? '').toUpperCase()] ?? valor) : valor
}

function escaparHtml(texto) {
    return String(texto ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

function preencher(texto, lead, html) {
    return String(texto ?? '').replace(VARIAVEIS, (trecho, chave) => (html ? escaparHtml(valorDaVariavel(lead, chave)) : String(valorDaVariavel(lead, chave) ?? '')))
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
