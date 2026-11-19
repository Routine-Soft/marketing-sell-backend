// Texto da mensagem com as variáveis trocadas: {nome} (empresa), {contato} (primeiro nome da pessoa; sem ela, o nome
// da empresa), {cidade} e {negocio} (nome do negócio que envia). Variável sem valor some (sem deixar "{...}").
export const VARIAVEIS = ['nome', 'contato', 'cidade', 'negocio']

// Fontes de leads dos Estados Unidos: número sem "+" e com 10 dígitos ganha o código do país 1.
const FONTES_EUA = ['npi', 'google', 'empresas_novas', 'licencas']

function primeiroNome(nome) {
    return String(nome ?? '').trim().split(/\s+/)[0] ?? ''
}

export function montarTexto(modelo, lead, nomeNegocio = '') {
    const valores = {
        nome: lead?.nome ?? '',
        contato: primeiroNome(lead?.contato) || lead?.nome || '',
        cidade: lead?.cidade ?? '',
        negocio: nomeNegocio,
    }
    return String(modelo ?? '')
        .replace(/\{(\w+)\}/g, (trecho, nome) => (VARIAVEIS.includes(nome) ? String(valores[nome] ?? '') : trecho))
        .replace(/[ \t]{2,}/g, ' ')
        .replace(/ ([,.!?])/g, '$1')
        .trim()
}

// Telefone no formato do WhatsApp (só dígitos, com o país), ou null quando não parece válido.
//  - com "+": usado como está;
//  - lead dos EUA: 10 dígitos ganham o 1 na frente;
//  - Brasil: DDD + número ganham o 55; celular antigo de 8 dígitos (começa com 6 a 9) ganha o 9 na frente.
export function telefoneDoLead(telefone, fonte = '') {
    const texto = String(telefone ?? '').trim()
    let digitos = texto.replace(/\D/g, '').replace(/^0+/, '')
    if (texto.startsWith('+')) return /^\d{8,15}$/.test(digitos) ? digitos : null

    if (FONTES_EUA.includes(fonte)) {
        if (digitos.length === 10) digitos = `1${digitos}`
        return /^1\d{10}$/.test(digitos) ? digitos : null
    }

    if (digitos.length === 12 || digitos.length === 13) digitos = digitos.replace(/^55/, '')
    if (digitos.length === 10 && /^[6-9]/.test(digitos.slice(2))) digitos = `${digitos.slice(0, 2)}9${digitos.slice(2)}`
    return /^\d{10,11}$/.test(digitos) ? `55${digitos}` : null
}
