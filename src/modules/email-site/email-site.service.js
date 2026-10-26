import mongoose from 'mongoose'
import LeadModel from '../lead/lead.model.js'

// A busca de e-mail no site é lenta (várias páginas por lead), então vai para uma fila no banco
// (emailStatus 'na_fila') e o processador (email-site.fila.js) trabalha em segundo plano.
export const EmailSiteService = {
    // `filtro`: { ids } ou { buscaId }. Só leads sem e-mail e que não estão na fila.
    async enfileirar(tenantId, { ids, buscaId }) {
        const base = { tenantId, email: '', emailStatus: { $in: ['nao_buscado', 'nao_encontrado'] } }
        if (ids) base._id = { $in: ids.filter((id) => mongoose.isValidObjectId(id)) }
        if (buscaId) base.buscaId = buscaId

        await LeadModel.updateMany({ ...base, site: '' }, { $set: { emailStatus: 'sem_site' } })
        const resultado = await LeadModel.updateMany(
            { ...base, site: { $ne: '' } },
            { $set: { emailStatus: 'na_fila', emailBuscaEm: new Date() } },
        )
        return resultado.modifiedCount
    },
}
