import AppError from '../../errors/AppError.js'
import { FONTES } from './fontes/index.js'

export function buscaDTO(body) {
    const fonte = FONTES[body?.fonte]
    if (!fonte) throw new AppError('Escolha uma fonte de dados', 400)
    return {
        fonte,
        filtros: body.filtros && typeof body.filtros === 'object' ? body.filtros : {},
        buscarEmails: body.buscarEmails === true,
    }
}
