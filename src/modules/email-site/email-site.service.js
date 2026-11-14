import LeadModel from '../lead/lead.model.js'

// A busca de e-mail no site é lenta (várias páginas por lead), então vai para uma fila no banco
// (emailStatus 'na_fila') e o processador (email-site.fila.js) trabalha em segundo plano.
export const EmailSiteService = {
    // filtro = os leads escolhidos (já com o tenantId) ou buscaId = os de uma busca. Só leads sem e-mail e fora da fila.
    async enfileirar(tenantId, { filtro, buscaId }) {
        const base = { ...filtro, tenantId, email: '', emailStatus: { $in: ['nao_buscado', 'nao_encontrado'] } }
        if (buscaId) base.buscaId = buscaId

        await LeadModel.updateMany({ ...base, site: '' }, { $set: { emailStatus: 'sem_site' } })
        const resultado = await LeadModel.updateMany(
            { ...base, site: { $ne: '' } },
            { $set: { emailStatus: 'na_fila', emailBuscaEm: new Date() } },
        )
        return resultado.modifiedCount
    },
}
