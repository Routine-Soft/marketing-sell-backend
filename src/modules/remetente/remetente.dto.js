import AppError from '../../errors/AppError.js'

// Até 3 textos de follow-up (2º, 3º e 4º e-mail).
function followUpsDTO(lista) {
    return (Array.isArray(lista) ? lista : []).slice(0, 3).map((item) => ({
        assunto: String(item?.assunto ?? '').trim(),
        corpo: String(item?.corpo ?? ''),
    }))
}

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
        followUpAtivo: !!body?.followUpAtivo,
        followUps: followUpsDTO(body?.followUps),
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
    if (body?.followUpAtivo !== undefined) dados.followUpAtivo = !!body.followUpAtivo
    if (body?.followUps !== undefined) dados.followUps = followUpsDTO(body.followUps)
    if (body?.ativo !== undefined) dados.ativo = !!body.ativo
    return dados
}
