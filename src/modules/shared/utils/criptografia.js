import crypto from 'crypto'

const ALGORITMO = 'aes-256-gcm'

// Chave de 32 bytes em hex, gerada uma vez e fixa no .env (EMAIL_CRYPTO_KEY). Trocar a chave invalida tudo que já
// foi criptografado com a anterior.
function chave() {
    const hex = process.env.EMAIL_CRYPTO_KEY
    if (!hex) throw new Error('EMAIL_CRYPTO_KEY não definida no .env')
    return Buffer.from(hex, 'hex')
}

// Guarda tudo numa única string "iv:tag:dados" (hex) para caber num campo de texto no banco.
export function criptografar(texto) {
    const iv = crypto.randomBytes(12)
    const cipher = crypto.createCipheriv(ALGORITMO, chave(), iv)
    const dados = Buffer.concat([cipher.update(String(texto), 'utf8'), cipher.final()])
    const tag = cipher.getAuthTag()
    return [iv, tag, dados].map((b) => b.toString('hex')).join(':')
}

export function descriptografar(textoCriptografado) {
    const [ivHex, tagHex, dadosHex] = String(textoCriptografado).split(':')
    const decipher = crypto.createDecipheriv(ALGORITMO, chave(), Buffer.from(ivHex, 'hex'))
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
    const dados = Buffer.concat([decipher.update(Buffer.from(dadosHex, 'hex')), decipher.final()])
    return dados.toString('utf8')
}
