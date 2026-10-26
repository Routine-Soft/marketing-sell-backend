import AppError from '../../../errors/AppError.js'
import { cepEua, nomeBonito, quantidadeValida, telefoneEua, texto } from './formatar.js'
import { consultarSocrata, textoSoql } from './socrata.js'

// Prestadores de serviço licenciados, com nome e telefone, pelos órgãos estaduais de licenças.
// Por enquanto o Texas (TDLR - Texas Department of Licensing and Regulation), que publica todas as licenças
// em data.texas.gov. Outros estados entram como novos itens em ESTADOS.
const MAXIMO = 2000

// Tipos de licença que vêm com telefone no dataset (licenças de pessoa física, como barbeiro ou eletricista,
// não trazem telefone). Ordem: os com mais registros primeiro.
const TIPOS_TEXAS = [
    { valor: 'Full Service Establishment', pt: 'Salão de beleza', en: 'Beauty salon (full service)' },
    { valor: 'Mini Establishment', pt: 'Salão pequeno / cadeira alugada', en: 'Mini salon' },
    { valor: 'Electrical Contractor', pt: 'Elétrica (empresa)', en: 'Electrical contractor' },
    { valor: 'Manicurist/Esthetician Establishment', pt: 'Manicure e estética', en: 'Nail & esthetics salon' },
    { valor: 'Esthetician Establishment', pt: 'Estética', en: 'Esthetician establishment' },
    { valor: 'Water Well Driller/Pump Installer', pt: 'Poços e bombas d\'água', en: 'Water well driller' },
    { valor: 'Manicurist Establishment', pt: 'Manicure', en: 'Nail salon' },
    { valor: 'Appliance Installation Contractor', pt: 'Instalação de eletrodomésticos', en: 'Appliance installation contractor' },
    { valor: 'Used Auto Parts Recycler', pt: 'Autopeças usadas', en: 'Used auto parts recycler' },
    { valor: 'Electrical Sign Contractor', pt: 'Letreiros luminosos', en: 'Electrical sign contractor' },
    { valor: 'Eyelash Extension Establishment', pt: 'Extensão de cílios', en: 'Eyelash extension studio' },
    { valor: 'Registered Accessibility Specialist', pt: 'Especialista em acessibilidade', en: 'Accessibility specialist' },
    { valor: 'Cosmetology Private School', pt: 'Escola de beleza', en: 'Cosmetology school' },
    { valor: 'Service Contract Provider', pt: 'Garantia estendida / contratos de serviço', en: 'Service contract provider' },
    { valor: 'Professional Employer Organization', pt: 'Terceirização de RH (PEO)', en: 'Professional employer organization' },
    { valor: 'Elevator Contractor', pt: 'Elevadores', en: 'Elevator contractor' },
    { valor: 'Mobile Establishment', pt: 'Salão móvel', en: 'Mobile salon' },
    { valor: 'Barber School', pt: 'Escola de barbeiro', en: 'Barber school' },
    { valor: 'Licensed Breeder', pt: 'Criador de cães e gatos', en: 'Licensed breeder' },
]

const ESTADOS = {
    TX: {
        nome: 'Texas',
        dominio: 'data.texas.gov',
        dataset: '7358-krk7',
        tipos: TIPOS_TEXAS,
    },
}

export const ESTADOS_LICENCAS = Object.entries(ESTADOS).map(([sigla, e]) => ({ valor: sigla, nome: e.nome, tipos: e.tipos }))

function filtrosValidos(filtros) {
    const estado = texto(filtros.estado || 'TX').toUpperCase()
    const config = ESTADOS[estado]
    if (!config) throw new AppError('Escolha um dos estados disponíveis', 400)
    const tipo = texto(filtros.tipo)
    if (!config.tipos.some((t) => t.valor === tipo)) throw new AppError('Escolha o tipo de prestador', 400)
    return {
        estado,
        tipo,
        cidade: texto(filtros.cidade),
        condado: texto(filtros.condado),
        palavra: texto(filtros.palavra),
        quantidade: quantidadeValida(filtros.quantidade, 500, MAXIMO),
    }
}

// "AUSTIN TX 78731-4298" -> cidade, estado e CEP.
function separarCidade(valor) {
    const partes = texto(valor).match(/^(.*?)\s+([A-Z]{2})\s+([\d-]+)$/)
    if (!partes) return { cidade: nomeBonito(valor), estado: '', cep: '' }
    return { cidade: nomeBonito(partes[1]), estado: partes[2], cep: cepEua(partes[3]) }
}

function paraLead(r) {
    const local = separarCidade(r.business_city_state_zip)
    const dono = texto(r.owner_name)
    return {
        idExterno: `${r.license_type}:${r.license_number}`,
        nome: nomeBonito(r.business_name || dono),
        contato: dono && dono !== texto(r.business_name) ? nomeBonito(dono) : '',
        categoria: texto(r.license_type),
        telefone: telefoneEua(r.business_telephone || r.owner_telephone),
        endereco: nomeBonito([r.business_address_line1, r.business_address_line2].filter(Boolean).join(', ')),
        ...local,
        extras: {
            licenca: texto(r.license_number),
            validade: texto(r.license_expiration_date_mmddccyy),
            condado: nomeBonito(r.business_county),
        },
    }
}

export const fonteLicencas = {
    id: 'licencas',
    nome: 'Prestadores licenciados',

    async buscar(filtrosBrutos) {
        const filtros = filtrosValidos(filtrosBrutos)
        const config = ESTADOS[filtros.estado]

        // Só quem tem telefone: é o motivo desta fonte.
        const where = [`license_type = '${filtros.tipo.replace(/'/g, "''")}'`, 'business_telephone IS NOT NULL']
        if (filtros.cidade) where.push(`upper(business_city_state_zip) like '${textoSoql(filtros.cidade)} %'`)
        if (filtros.condado) where.push(`upper(business_county) = '${textoSoql(filtros.condado)}'`)
        if (filtros.palavra) where.push(`upper(business_name) like '%${textoSoql(filtros.palavra)}%'`)

        const linhas = await consultarSocrata({
            dominio: config.dominio,
            dataset: config.dataset,
            where,
            ordem: 'license_number',
            limite: filtros.quantidade,
            nomeFonte: `o portal de licenças de ${config.nome}`,
        })
        return { filtros, leads: linhas.map(paraLead).filter((l) => l.nome), requisicoesGoogle: 0 }
    },
}
