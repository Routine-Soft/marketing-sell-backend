import RemetenteModel from '../remetente/remetente.model.js'
import LeadModel from '../lead/lead.model.js'
import EnvioModel from '../envio/envio.model.js'
import { MAXIMO_DE_CONTATOS } from '../lead/lead.contato.js'
import { montarAssunto, montarCorpo } from '../envio/envio.template.js'
import { diaDe, diaUtil, horaAgora } from '../shared/utils/dia.js'

const POR_RODADA = 200

// Follow-up automático por e-mail: quem recebeu o primeiro e-mail de um negócio, não respondeu e está com o
// follow-up vencido entra na fila de envio com o texto do 2º, 3º ou 4º e-mail daquele remetente.
// Só em dia útil, das 9h às 18h (Brasília). Lead cujo último envio deu erro fica de fora (não insiste sozinho).
export async function enfileirarFollowUps() {
    const hora = horaAgora()
    if (!diaUtil(diaDe()) || hora < 9 || hora >= 18) return 0

    let total = 0
    const remetentes = await RemetenteModel.find({ ativo: true, followUpAtivo: true })
    for (const remetente of remetentes) {
        const leads = await LeadModel.find({
            tenantId: remetente.tenantId,
            status: 'contatado',
            email: { $ne: '' },
            envioPendente: false,
            envioErro: '',
            ultimoEnvioNegocio: remetente.nomeNegocio,
            numeroContatos: { $gte: 1, $lt: MAXIMO_DE_CONTATOS },
            proximoFollowUpEm: { $ne: null, $lte: new Date() },
        }).limit(POR_RODADA)

        for (const lead of leads) {
            const modelo = remetente.followUps[lead.numeroContatos - 1]
            if (!modelo?.corpo.trim()) continue
            await EnvioModel.create({
                tenantId: remetente.tenantId,
                remetenteId: remetente._id,
                leadId: lead._id,
                email: remetente.email,
                para: lead.email,
                assunto: montarAssunto(modelo.assunto || `Re: ${remetente.assuntoPadrao}`, lead),
                corpoHtml: montarCorpo(modelo.corpo, remetente.rodape, lead),
                followUp: lead.numeroContatos,
                status: 'na_fila',
            })
            await LeadModel.updateOne({ _id: lead._id }, { $set: { envioPendente: true } })
            total += 1
        }
    }
    return total
}
