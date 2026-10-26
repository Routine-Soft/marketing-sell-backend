import AppError from '../../../errors/AppError.js'

export const ESTADOS_EUA = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY',
    'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA',
    'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY']

export function texto(valor) {
    return String(valor ?? '').replace(/\s+/g, ' ').trim()
}

// As fontes oficiais mandam tudo em maiúsculas ("JOHN SMITH LLC"); vira "John Smith LLC".
// Siglas curtas comuns de empresa continuam em maiúsculas.
const SIGLAS = new Set(['LLC', 'LLP', 'LP', 'PC', 'PA', 'PLLC', 'DBA', 'PO', 'NE', 'NW', 'SE', 'SW', 'USA', 'DDS', 'DC', 'PT', 'LMT', 'MD', 'II', 'III', 'IV'])
export function nomeBonito(valor) {
    const limpo = texto(valor)
    if (!limpo || limpo !== limpo.toUpperCase()) return limpo
    return limpo.toLowerCase().replace(/[a-z0-9]+(?:'[a-z]+)?/g, (palavra) => {
        const maiuscula = palavra.toUpperCase()
        return SIGLAS.has(maiuscula) ? maiuscula : palavra[0].toUpperCase() + palavra.slice(1)
    })
}

// Telefone americano de 10 dígitos vira "(512) 632-5897"; o resto fica como veio.
export function telefoneEua(valor) {
    const digitos = String(valor ?? '').replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '')
    if (digitos.length !== 10) return texto(valor)
    return `(${digitos.slice(0, 3)}) ${digitos.slice(3, 6)}-${digitos.slice(6)}`
}

export function cepEua(valor) {
    const digitos = String(valor ?? '').replace(/\D/g, '')
    return digitos.length === 9 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : texto(valor)
}

export function estadoValido(valor, obrigatorio = true) {
    const estado = texto(valor).toUpperCase()
    if (!estado && !obrigatorio) return ''
    if (!ESTADOS_EUA.includes(estado)) throw new AppError('Escolha um estado válido', 400)
    return estado
}

export function quantidadeValida(valor, padrao, maximo) {
    const numero = Number.parseInt(valor, 10)
    if (!Number.isFinite(numero) || numero < 1) return padrao
    return Math.min(numero, maximo)
}

// GET com tempo limite. Falha da fonte vira erro 502 com o nome dela, para a tela explicar.
export async function buscarJson(url, { nomeFonte, headers = {}, metodo = 'GET', corpo, tempoMs = 30000 } = {}) {
    let resposta
    try {
        resposta = await fetch(url, {
            method: metodo,
            headers,
            body: corpo,
            signal: AbortSignal.timeout(tempoMs),
        })
    } catch {
        throw new AppError(`Não foi possível falar com ${nomeFonte} agora. Tente de novo em alguns minutos.`, 502)
    }
    const dados = await resposta.json().catch(() => null)
    if (!resposta.ok) {
        console.error(`${nomeFonte} respondeu ${resposta.status}: ${JSON.stringify(dados)?.slice(0, 500)}`)
        throw new AppError(`${nomeFonte} recusou a busca agora. Tente de novo em alguns minutos.`, 502)
    }
    return dados
}
