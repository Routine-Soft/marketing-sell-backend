import AppError from '../../errors/AppError.js'

function texto(valor) {
    return String(valor ?? '').trim()
}

export function createUserDTO(body) {
    const dto = {
        nomeCompleto: texto(body.nomeCompleto),
        email: texto(body.email).toLowerCase(),
        password: String(body.password ?? ''),
        telefone: texto(body.telefone),
        nomeEmpresa: texto(body.nomeEmpresa),
    }
    if (!dto.nomeCompleto || !dto.email || !dto.nomeEmpresa) {
        throw new AppError('Informe nome, e-mail e nome da empresa', 400)
    }
    if (dto.password.length < 6) {
        throw new AppError('A senha precisa ter pelo menos 6 caracteres', 400)
    }
    return dto
}

export function updateMeDTO(body, role) {
    const allowed = ['nomeCompleto', 'email', 'telefone']
    if (['admin', 'super_admin'].includes(role)) {
        allowed.push('nomeEmpresa')
    }

    const dto = Object.fromEntries(
        Object.entries(body ?? {}).filter(([key]) => allowed.includes(key)).map(([key, valor]) => [key, texto(valor)])
    )
    if ('nomeCompleto' in dto && !dto.nomeCompleto) delete dto.nomeCompleto
    if ('email' in dto && !dto.email) delete dto.email
    if ('nomeEmpresa' in dto && !dto.nomeEmpresa) delete dto.nomeEmpresa
    return dto
}

export function loginUserDTO(body) {
    return {
        email: String(body?.email ?? '').replace(/\s+/g, '').toLowerCase(),
        password: String(body?.password ?? ''),
    }
}
