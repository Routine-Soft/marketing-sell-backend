import { Readable, Transform } from 'node:stream'
import readline from 'node:readline'
import zlib from 'node:zlib'

// Arquivos da Receita: compartilhamento público do Nextcloud deles, lido pelo WebDAV (usuário = código do
// compartilhamento, sem senha). Endereço conferido em 2026-11-14.
export const BASE_RECEITA = 'https://arquivos.receitafederal.gov.br/public.php/webdav'
const COMPARTILHAMENTO = 'YggdBLfdninEJX9'
const AUTORIZACAO = `Basic ${Buffer.from(`${COMPARTILHAMENTO}:`).toString('base64')}`

// Pastas 'AAAA-MM' publicadas, da mais nova para a mais antiga.
export async function competenciasPublicadas() {
    const resposta = await fetch(`${BASE_RECEITA}/`, { method: 'PROPFIND', headers: { Authorization: AUTORIZACAO, Depth: '1' } })
    if (!resposta.ok) throw new Error(`Receita respondeu ${resposta.status} ao listar as competências`)
    const xml = await resposta.text()
    return [...new Set([...xml.matchAll(/\/(\d{4}-\d{2})\/<\/d:href>/g)].map((m) => m[1]))].sort().reverse()
}

// Tira o cabeçalho local do zip (os arquivos da Receita têm um arquivo só, comprimido com deflate) e deixa passar
// os dados comprimidos. Assim o zip é lido enquanto baixa, sem gravar em disco.
class SemCabecalhoDoZip extends Transform {
    constructor() {
        super()
        this.inicio = Buffer.alloc(0)
        this.pronto = false
    }

    _transform(pedaco, _codificacao, seguir) {
        if (this.pronto) return seguir(null, pedaco)
        this.inicio = Buffer.concat([this.inicio, pedaco])
        if (this.inicio.length < 30) return seguir()
        if (this.inicio.readUInt32LE(0) !== 0x04034b50) return seguir(new Error('O arquivo baixado não é um zip'))
        if (this.inicio.readUInt16LE(8) !== 8) return seguir(new Error('Zip com compressão diferente de deflate'))
        const fimDoCabecalho = 30 + this.inicio.readUInt16LE(26) + this.inicio.readUInt16LE(28)
        if (this.inicio.length < fimDoCabecalho) return seguir()
        this.pronto = true
        const resto = this.inicio.subarray(fimDoCabecalho)
        this.inicio = null
        return seguir(null, resto)
    }
}

// Lê as linhas do CSV de dentro do zip, já separadas em campos. CSV da Receita: latin1, ";" e aspas em tudo.
export function camposDaLinha(linha) {
    return linha.replace(/^"|"\r?$/g, '').split('";"')
}

export async function* linhasDoZip(entrada) {
    const inflar = zlib.createInflateRaw()
    entrada.on('error', (erro) => inflar.destroy(erro))
    entrada.pipe(new SemCabecalhoDoZip()).on('error', (erro) => inflar.destroy(erro)).pipe(inflar)
    inflar.setEncoding('latin1')
    const linhas = readline.createInterface({ input: inflar, crlfDelay: Infinity })
    try {
        for await (const linha of linhas) {
            if (linha) yield camposDaLinha(linha)
        }
    } finally {
        entrada.destroy()
    }
}

export async function baixarZip(competencia, arquivo) {
    const resposta = await fetch(`${BASE_RECEITA}/${competencia}/${arquivo}`, { headers: { Authorization: AUTORIZACAO } })
    if (!resposta.ok) throw new Error(`Receita respondeu ${resposta.status} para ${competencia}/${arquivo}`)
    return Readable.fromWeb(resposta.body)
}
