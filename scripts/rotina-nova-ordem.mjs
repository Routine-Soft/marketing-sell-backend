// Aplica a ordem nova da rotina (2026-11-20: respostas e follow-up, contato, conteúdo/parceiros/comunidades e, no fim,
// a captação com 30 minutos) nos negócios que já existiam. Só mexe nos blocos e linhas que ainda estão como no modelo
// antigo: o que a pessoa mudou à mão fica como está. Os ids não mudam, então o que já foi marcado continua valendo.
// Uso: node --env-file=.env scripts/rotina-nova-ordem.mjs            (só mostra o que mudaria)
//      node --env-file=.env scripts/rotina-nova-ordem.mjs --aplicar  (grava)
import mongoose from 'mongoose'
import db from '../src/db/db.js'
import NegocioModel from '../src/modules/negocio/negocio.model.js'
import { MODELOS_DO_SISTEMA } from '../src/modules/negocio/modelos.padrao.js'

const aplicar = process.argv.includes('--aplicar')

// Nome antigo do bloco → modelo novo; linha antiga (título) → modelo novo.
const ANTIGOS = {
    marketing_vendas: {
        blocos: ['1. Leads', '2. Contato', '3. Follow-up', '4. Vídeo', '5. Blog', '6. Parceiros', '7. Comunidades', '8. Fechamento'],
        linhas: {
            leads: 'Pegar 30 leads novos e cadastrar na aba Leads',
            leads_no_dia: 'Leads cadastrados no dia',
            primeiro_contato: 'Fazer o 1º contato com os 30 leads',
            contatos_no_dia: 'Primeiros contatos no dia',
            follow_up: 'Follow-up de quem está com data vencida (aba Leads)',
        },
    },
    prospeccao_simples: {
        blocos: ['1. Leads', '2. Contato', '3. Follow-up', '4. Redes sociais', '5. Fechamento'],
        linhas: {
            leads: 'Pegar 20 leads novos',
            leads_no_dia: 'Leads cadastrados no dia',
            primeiro_contato: 'Fazer o 1º contato com 20 leads',
            follow_up: 'Follow-up de quem está com data vencida',
        },
    },
}

await db()
let mudaram = 0
for (const negocio of await NegocioModel.find()) {
    const blocos = negocio.rotina.blocos.map((b) => b.toObject())
    const linhas = negocio.rotina.linhas.map((l) => l.toObject())
    const id = Object.keys(ANTIGOS).find((m) => ANTIGOS[m].blocos.join('|') === blocos.map((b) => b.nome).join('|'))
    if (!id) {
        console.log(`Pulado (rotina diferente do modelo antigo): ${negocio.nome}`)
        continue
    }
    const modelo = MODELOS_DO_SISTEMA.find((m) => m.id === id).rotina
    const novosBlocos = modelo.blocos.map((b) => ({ ...blocos.find((x) => x.id === b.id), nome: b.nome }))
    const novasLinhas = novosBlocos.flatMap((b) => linhas.filter((l) => l.bloco === b.id)).map((l) => {
        const nova = modelo.linhas.find((m) => m.id === l.id)
        return nova && ANTIGOS[id].linhas[l.id] === l.titulo ? { ...l, titulo: nova.titulo, meta: nova.meta } : l
    })
    if (novasLinhas.length !== linhas.length) throw new Error(`Linhas sem bloco em ${negocio.nome}`)
    mudaram++
    console.log(`${aplicar ? 'Atualizado' : 'Mudaria'}: ${negocio.nome} → ${novosBlocos.map((b) => b.nome).join(' | ')}`)
    if (aplicar) {
        negocio.rotina.blocos = novosBlocos
        negocio.rotina.linhas = novasLinhas
        await negocio.save()
    }
}
console.log(`${mudaram} negócio(s) ${aplicar ? 'atualizado(s)' : 'mudariam; rode com --aplicar para gravar'}`)
await mongoose.disconnect()
