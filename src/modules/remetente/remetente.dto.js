import AppError from '../../errors/AppError.js'

export function criarRemetenteDTO(body) {
    const nomeNegocio = String(body?.nomeNegocio ?? '').trim()
    const email = String(body?.email ?? '').trim()
    const senhaApp = String(body?.senhaApp ?? '').trim()

    if (!nomeNegocio) throw new AppError('Informe o nome do negócio', 400)
    if (!email) throw new AppError('Informe o e-mail do Gmail', 400)
    if (!senhaApp) throw new AppError('Informe a senha de app do Gmail', 400)

    return {
        nomeNegocio,
        nomeExibicao: String(body?.nomeExibicao ?? '').trim() || nomeNegocio,
        email,
        senhaApp,
        assuntoPadrao: String(body?.assuntoPadrao ?? ''),
        corpoPadrao: String(body?.corpoPadrao ?? ''),
        rodape: String(body?.rodape ?? ''),
    }
}

export function editarRemetenteDTO(body) {
    const dados = {}
    if (body?.nomeExibicao !== undefined) dados.nomeExibicao = String(body.nomeExibicao).trim()
    if (body?.email !== undefined) dados.email = String(body.email).trim()
    if (body?.senhaApp !== undefined && String(body.senhaApp).trim()) dados.senhaApp = String(body.senhaApp).trim()
    if (body?.assuntoPadrao !== undefined) dados.assuntoPadrao = String(body.assuntoPadrao)
    if (body?.corpoPadrao !== undefined) dados.corpoPadrao = String(body.corpoPadrao)
    if (body?.rodape !== undefined) dados.rodape = String(body.rodape)
    if (body?.ativo !== undefined) dados.ativo = !!body.ativo
    return dados
}
