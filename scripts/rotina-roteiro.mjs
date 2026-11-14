// Põe a tarefa "Criar roteiro e legenda" como a primeira do bloco de vídeo (ou de redes sociais) nas rotinas dos
// negócios que já existiam (pedido de 2026-11-14: padrão para todos). Pode rodar mais de uma vez.
// Uso: node --env-file=.env scripts/rotina-roteiro.mjs            (só mostra o que mudaria)
//      node --env-file=.env scripts/rotina-roteiro.mjs --aplicar  (grava)
import mongoose from 'mongoose'
import db from '../src/db/db.js'
import NegocioModel from '../src/modules/negocio/negocio.model.js'

const aplicar = process.argv.includes('--aplicar')
const LINHA = { id: 'video_roteiro', tipo: 'tarefa', titulo: 'Criar roteiro e legenda (Ideias de vídeo)', meta: 1, auto: '', contagem: '', dias: [] }

await db()
let mudariam = 0
for (const negocio of await NegocioModel.find({ 'rotina.linhas.id': { $ne: LINHA.id } })) {
    const bloco = ['video', 'redes'].find((id) => negocio.rotina.blocos.some((b) => b.id === id))
    if (!bloco) continue
    const linhas = negocio.rotina.linhas.map((linha) => linha.toObject())
    const posicao = linhas.findIndex((linha) => linha.bloco === bloco)
    linhas.splice(posicao === -1 ? linhas.length : posicao, 0, { ...LINHA, bloco })
    mudariam++
    console.log(`${aplicar ? 'Atualizado' : 'Mudaria'}: ${negocio.nome} (bloco ${bloco})`)
    if (aplicar) {
        negocio.rotina.linhas = linhas
        await negocio.save()
    }
}
console.log(`${mudariam} negócio(s) ${aplicar ? 'atualizado(s)' : 'mudariam; rode com --aplicar para gravar'}`)
await mongoose.disconnect()
