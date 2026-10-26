import dns from 'node:dns/promises'
import net from 'node:net'

// Procura um e-mail de contato no site de um lead: página inicial e as páginas de contato/sobre mais comuns.
// Baseado no script de leads com Google Places, com proteções: só endereços públicos (nada de rede interna),
// tempo e tamanho limitados por página, e preferência pelo e-mail do próprio domínio do site.
const PAGINAS = ['', '/contact', '/contact-us', '/about', '/about-us']
const TEMPO_POR_PAGINA_MS = 10000
const TAMANHO_MAXIMO = 1_500_000
const MAX_REDIRECIONAMENTOS = 3
const USER_AGENT = 'Mozilla/5.0 (compatible; MarketingSellBot/1.0)'

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
const FINAIS_RUINS = /\.(png|jpe?g|gif|webp|svg|css|js|ico|woff2?)$/i
const PALAVRAS_RUINS = /(sentry|wixpress|example\.|domain\.com|your@|email@|yourname|name@|user@|@sentry|godaddy|squarespace|wordpress|placeholder)/i

// Bloqueia IPs privados, de loopback e reservados: o servidor não pode ser usado para acessar a rede interna.
function ipPublico(ip) {
    if (net.isIPv4(ip)) {
        const [a, b] = ip.split('.').map(Number)
        return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127)
            || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168))
    }
    const v6 = ip.toLowerCase()
    if (v6.startsWith('::ffff:')) return ipPublico(v6.slice(7))
    return !(v6 === '::' || v6 === '::1' || v6.startsWith('fc') || v6.startsWith('fd') || v6.startsWith('fe80'))
}

async function urlSegura(url) {
    if (!['http:', 'https:'].includes(url.protocol)) return false
    if (url.port && !['80', '443'].includes(url.port)) return false
    try {
        const enderecos = await dns.lookup(url.hostname, { all: true })
        return enderecos.length > 0 && enderecos.every((e) => ipPublico(e.address))
    } catch {
        return false
    }
}

async function lerTexto(resposta) {
    const leitor = resposta.body?.getReader()
    if (!leitor) return ''
    const partes = []
    let tamanho = 0
    while (tamanho < TAMANHO_MAXIMO) {
        const { done, value } = await leitor.read()
        if (done) break
        partes.push(value)
        tamanho += value.length
    }
    leitor.cancel().catch(() => {})
    return Buffer.concat(partes).toString('utf8')
}

// Segue redirecionamentos na mão para conferir cada destino.
async function baixarPagina(endereco) {
    let url = endereco
    for (let i = 0; i <= MAX_REDIRECIONAMENTOS; i++) {
        if (!(await urlSegura(url))) return ''
        let resposta
        try {
            resposta = await fetch(url, {
                redirect: 'manual',
                signal: AbortSignal.timeout(TEMPO_POR_PAGINA_MS),
                headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,*/*;q=0.8' },
            })
        } catch {
            return ''
        }
        if (resposta.status >= 300 && resposta.status < 400 && resposta.headers.get('location')) {
            url = new URL(resposta.headers.get('location'), url)
            continue
        }
        if (!resposta.ok || !String(resposta.headers.get('content-type') ?? '').includes('html')) return ''
        try {
            return await lerTexto(resposta)
        } catch {
            return ''
        }
    }
    return ''
}

// Cloudflare esconde os e-mails em data-cfemail (hex com XOR pela primeira chave).
function emailsDoCloudflare(html) {
    return [...html.matchAll(/data-cfemail="([0-9a-f]+)"/gi)].map(([, hex]) => {
        const chave = Number.parseInt(hex.slice(0, 2), 16)
        let email = ''
        for (let i = 2; i < hex.length; i += 2) email += String.fromCharCode(Number.parseInt(hex.slice(i, i + 2), 16) ^ chave)
        return email
    })
}

function emailsDaPagina(html) {
    const decodificado = html.replace(/&#64;|&#x40;|%40/gi, '@')
    const mailtos = [...decodificado.matchAll(/mailto:([^"'?>\s]+)/gi)].map(([, e]) => e)
    return [...mailtos, ...emailsDoCloudflare(html), ...(decodificado.match(EMAIL_RE) ?? [])]
        .map((e) => e.trim().toLowerCase())
        .filter((e) => /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(e) && !FINAIS_RUINS.test(e) && !PALAVRAS_RUINS.test(e))
}

function dominioBase(host) {
    return host.replace(/^www\./, '').split('.').slice(-2).join('.')
}

// Devolve o melhor e-mail encontrado, ou '' se não achar.
export async function encontrarEmailNoSite(site) {
    let base
    try {
        base = new URL(/^https?:\/\//i.test(site) ? site : `https://${site}`)
    } catch {
        return ''
    }
    const dominio = dominioBase(base.hostname)

    const achados = []
    for (const caminho of PAGINAS) {
        let html = await baixarPagina(caminho ? new URL(caminho, base) : base)
        // Site pequeno com certificado vencido ou sem https: tenta de novo pelo http.
        if (!html && !caminho && base.protocol === 'https:') {
            base = new URL(base.href.replace(/^https:/, 'http:'))
            html = await baixarPagina(base)
        }
        achados.push(...emailsDaPagina(html))
        // E-mail do próprio domínio é o melhor sinal: pode parar.
        if (achados.some((e) => e.endsWith(`@${dominio}`) || e.endsWith(`.${dominio}`))) break
    }
    const unicos = [...new Set(achados)]
    return unicos.find((e) => e.endsWith(`@${dominio}`)) ?? unicos[0] ?? ''
}
