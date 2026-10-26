import AppError from '../../../errors/AppError.js'
import { cepEua, nomeBonito, quantidadeValida, texto } from './formatar.js'
import { consultarSocrata, textoSoql } from './socrata.js'

// Empresas recém-abertas, pelos dados abertos da Secretaria de Estado (Secretary of State) de cada estado.
// Não existe uma base nacional: cada estado publica do seu jeito. Aqui entram os que têm API aberta (Socrata);
// para incluir outro estado, basta acrescentar um item em ESTADOS.
// Esses cadastros não trazem telefone (Connecticut traz e-mail). O telefone/e-mail sai depois do site, se houver.
const MAXIMO = 2000

// Colorado manda o tipo da empresa em código.
const TIPOS_COLORADO = {
    DLLC: 'Limited Liability Company',
    DPC: 'Corporation',
    DNC: 'Nonprofit Corporation',
    FLLC: 'Foreign Limited Liability Company',
    FPC: 'Foreign Corporation',
    DLP: 'Limited Partnership',
    DLLP: 'Limited Liability Partnership',
}

const ESTADOS = {
    CO: {
        nome: 'Colorado',
        dominio: 'data.colorado.gov',
        dataset: '4ykn-tg5h',
        campoData: 'entityformdate',
        campoNome: 'entityname',
        campoCidade: 'principalcity',
        paraLead: (r) => ({
            idExterno: r.entityid,
            nome: texto(r.entityname),
            categoria: TIPOS_COLORADO[r.entitytype] ?? texto(r.entitytype),
            endereco: texto(r.principaladdress1),
            cidade: nomeBonito(r.principalcity),
            estado: texto(r.principalstate),
            cep: cepEua(r.principalzipcode),
            extras: { abertura: r.entityformdate ?? null, situacao: texto(r.entitystatus) },
        }),
    },
    CT: {
        nome: 'Connecticut',
        dominio: 'data.ct.gov',
        dataset: 'n7gp-d28j',
        campoData: 'date_registration',
        campoNome: 'name',
        campoCidade: 'billingcity',
        paraLead: (r) => ({
            idExterno: r.accountnumber ?? r.id,
            nome: texto(r.name),
            categoria: texto(r.business_type),
            email: texto(r.business_email_address).toLowerCase(),
            endereco: [r.billingstreet, r.billing_unit].filter(Boolean).map(texto).join(', '),
            cidade: nomeBonito(r.billingcity),
            estado: texto(r.billingstate),
            cep: cepEua(r.billingpostalcode),
            extras: { abertura: r.date_registration ?? null, situacao: texto(r.status), naics: texto(r.naics_code) },
        }),
    },
    NY: {
        nome: 'New York',
        dominio: 'data.ny.gov',
        dataset: 'n9v6-gdp6',
        campoData: 'initial_dos_filing_date',
        campoNome: 'current_entity_name',
        campoCidade: 'dos_process_city',
        // Endereço para correspondência oficial: muitas vezes é o do agente registrado, não o da empresa.
        paraLead: (r) => ({
            idExterno: r.dos_id,
            nome: nomeBonito(r.current_entity_name),
            contato: r.dos_process_name !== r.current_entity_name ? nomeBonito(r.dos_process_name) : '',
            categoria: nomeBonito(r.entity_type),
            endereco: nomeBonito(r.dos_process_address_1),
            cidade: nomeBonito(r.dos_process_city),
            estado: texto(r.dos_process_state),
            cep: cepEua(r.dos_process_zip),
            extras: { abertura: r.initial_dos_filing_date ?? null, condado: texto(r.county) },
        }),
    },
    OR: {
        nome: 'Oregon',
        dominio: 'data.oregon.gov',
        // "New Businesses Registered Last Month": só o mês passado, uma linha por pessoa/endereço ligado à empresa.
        dataset: 'esjy-u4fc',
        campoData: 'registry_date',
        campoNome: 'business_name',
        campoCidade: 'city',
        linhasPorEmpresa: 6,
        agrupar: agruparOregon,
    },
}

const PAPEIS_CONTATO_OREGON = ['MEMBER', 'MANAGER', 'PRESIDENT', 'REGISTRANT', 'AUTHORIZED REPRESENTATIVE', 'INDIVIDUAL WITH DIRECT KNOWLEDGE']

function agruparOregon(linhas) {
    const porRegistro = new Map()
    for (const linha of linhas) {
        const lista = porRegistro.get(linha.registry_number) ?? []
        lista.push(linha)
        porRegistro.set(linha.registry_number, lista)
    }
    return [...porRegistro.values()].map((grupo) => {
        const local = grupo.find((l) => l.associated_name_type === 'PRINCIPAL PLACE OF BUSINESS')
            ?? grupo.find((l) => l.associated_name_type === 'MAILING ADDRESS') ?? grupo[0]
        const pessoa = PAPEIS_CONTATO_OREGON.map((p) => grupo.find((l) => l.associated_name_type === p && l.first_name)).find(Boolean)
        return {
            idExterno: local.registry_number,
            nome: nomeBonito(local.business_name),
            contato: pessoa ? nomeBonito([pessoa.first_name, pessoa.last_name].join(' ')) : '',
            categoria: nomeBonito(local.entity_type),
            endereco: nomeBonito([local.address_, local.address_continued].filter(Boolean).join(', ')),
            cidade: nomeBonito(local.city),
            estado: texto(local.state),
            cep: cepEua(local.zip_code),
            extras: { abertura: local.registry_date ?? null },
        }
    })
}

export const ESTADOS_EMPRESAS_NOVAS = Object.entries(ESTADOS).map(([sigla, e]) => ({ valor: sigla, nome: e.nome }))

function filtrosValidos(filtros) {
    const estado = texto(filtros.estado).toUpperCase()
    if (!ESTADOS[estado]) throw new AppError('Escolha um dos estados disponíveis', 400)

    const trintaDiasAtras = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const desde = /^\d{4}-\d{2}-\d{2}$/.test(filtros.desde ?? '') ? filtros.desde : trintaDiasAtras
    return {
        estado,
        desde,
        palavra: texto(filtros.palavra),
        cidade: texto(filtros.cidade),
        quantidade: quantidadeValida(filtros.quantidade, 500, MAXIMO),
    }
}

export const fonteEmpresasNovas = {
    id: 'empresas_novas',
    nome: 'Empresas novas',

    async buscar(filtrosBrutos) {
        const filtros = filtrosValidos(filtrosBrutos)
        const config = ESTADOS[filtros.estado]

        const where = [`${config.campoData} >= '${filtros.desde}T00:00:00'`]
        if (filtros.palavra) where.push(`upper(${config.campoNome}) like '%${textoSoql(filtros.palavra)}%'`)
        if (filtros.cidade) where.push(`upper(${config.campoCidade}) = '${textoSoql(filtros.cidade)}'`)

        const linhas = await consultarSocrata({
            dominio: config.dominio,
            dataset: config.dataset,
            where,
            ordem: `${config.campoData} DESC`,
            limite: filtros.quantidade * (config.linhasPorEmpresa ?? 1),
            nomeFonte: `o portal de dados de ${config.nome}`,
        })

        const leads = (config.agrupar ? config.agrupar(linhas) : linhas.map(config.paraLead))
            .filter((lead) => lead.idExterno && lead.nome)
            .slice(0, filtros.quantidade)
        return { filtros, leads, requisicoesGoogle: 0 }
    },
}
