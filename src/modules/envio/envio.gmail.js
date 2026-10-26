import nodemailer from 'nodemailer'
import { descriptografar } from '../shared/utils/criptografia.js'

// Um transporter por Gmail evita autenticar de novo a cada envio.
const transporters = new Map()

function transporterDo(remetente) {
    if (!transporters.has(remetente.email)) {
        transporters.set(remetente.email, nodemailer.createTransport({
            service: 'gmail',
            auth: { user: remetente.email, pass: descriptografar(remetente.senhaApp) },
        }))
    }
    return transporters.get(remetente.email)
}

// Chamar quando a senha de app mudar ou o remetente sair.
export function esquecerTransporter(email) {
    transporters.delete(email)
}

export async function enviarPeloGmail(remetente, { para, assunto, corpoHtml }) {
    await transporterDo(remetente).sendMail({
        from: { name: remetente.nomeExibicao, address: remetente.email },
        to: para,
        subject: assunto,
        html: corpoHtml,
    })
}

export function senhaRecusada(erro) {
    return erro?.code === 'EAUTH'
}

// Resposta do próprio Gmail quando a conta passou do limite do dia (ex.: "550 5.4.5 Daily user sending limit exceeded").
export function limiteDoGmail(erro) {
    return /5\.4\.5|sending limit/i.test(String(erro?.response ?? erro?.message ?? ''))
}
