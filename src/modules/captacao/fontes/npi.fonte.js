import AppError from '../../../errors/AppError.js'
import { buscarJson, cepEua, estadoValido, nomeBonito, quantidadeValida, telefoneEua, texto } from './formatar.js'

// NPI Registry (CMS): cadastro nacional de profissionais e clínicas de saúde dos EUA. Público e gratuito.
// Documentação: https://npiregistry.cms.hhs.gov/api-page
// Também cobre fisioterapeutas (APTA), massoterapeutas (AMTA) e quiropraxistas (ACA): essas associações
// não têm API pública, e todo profissional que atende convênio tem NPI.
const URL_API = 'https://npiregistry.cms.hhs.gov/api/'
const POR_PAGINA = 200
// A API não deixa pular mais de 1000 registros.
const MAXIMO = 1200

// Valor = descrição da especialidade (taxonomia) como a API espera.
export const ESPECIALIDADES_NPI = [
    { valor: 'Massage Therapist', pt: 'Massoterapeuta', en: 'Massage therapist' },
    { valor: 'Physical Therapist', pt: 'Fisioterapeuta', en: 'Physical therapist' },
    { valor: 'Chiropractor', pt: 'Quiropraxista', en: 'Chiropractor' },
    { valor: 'Occupational Therapist', pt: 'Terapeuta ocupacional', en: 'Occupational therapist' },
    { valor: 'Acupuncturist', pt: 'Acupunturista', en: 'Acupuncturist' },
    { valor: 'Dentist', pt: 'Dentista', en: 'Dentist' },
    { valor: 'Psychologist', pt: 'Psicólogo', en: 'Psychologist' },
    { valor: 'Counselor', pt: 'Conselheiro / terapeuta', en: 'Counselor' },
    { valor: 'Marriage & Family Therapist', pt: 'Terapeuta de casal e família', en: 'Marriage & family therapist' },
    { valor: 'Social Worker', pt: 'Assistente social', en: 'Social worker' },
    { valor: 'Behavior Analyst', pt: 'Analista do comportamento (ABA)', en: 'Behavior analyst' },
    { valor: 'Dietitian, Registered', pt: 'Nutricionista', en: 'Dietitian' },
    { valor: 'Speech-Language Pathologist', pt: 'Fonoaudiólogo', en: 'Speech-language pathologist' },
    { valor: 'Optometrist', pt: 'Optometrista', en: 'Optometrist' },
    { valor: 'Podiatrist', pt: 'Podólogo', en: 'Podiatrist' },
    { valor: 'Naturopath', pt: 'Naturopata', en: 'Naturopath' },
]

function filtrosValidos(filtros) {
    const especialidade = texto(filtros.especialidade)
    if (!especialidade) throw new AppError('Escolha a especialidade', 400)
    return {
        especialidade,
        estado: estadoValido(filtros.estado),
        cidade: texto(filtros.cidade),
        cep: texto(filtros.cep).replace(/\D/g, '').slice(0, 5),
        // 'pessoa' = profissional (NPI-1), 'empresa' = clínica (NPI-2), vazio = os dois.
        tipo: ['pessoa', 'empresa'].includes(filtros.tipo) ? filtros.tipo : '',
        quantidade: quantidadeValida(filtros.quantidade, 200, MAXIMO),
    }
}

function paraLead(registro, especialidade) {
    const basico = registro.basic ?? {}
    const ehEmpresa = registro.enumeration_type === 'NPI-2'
    const endereco = registro.addresses?.find((e) => e.address_purpose === 'LOCATION') ?? registro.addresses?.[0] ?? {}
    // A busca casa com qualquer especialidade da pessoa: mostra a que casou, senão a principal.
    const termo = especialidade.toLowerCase()
    const taxonomia = registro.taxonomies?.find((t) => t.desc?.toLowerCase().includes(termo))
        ?? registro.taxonomies?.find((t) => t.primary) ?? {}

    const nomePessoa = [basico.first_name, basico.middle_name, basico.last_name].filter(Boolean).join(' ')
    const responsavel = [basico.authorized_official_first_name, basico.authorized_official_last_name].filter(Boolean).join(' ')

    return {
        idExterno: String(registro.number),
        nome: nomeBonito(ehEmpresa ? basico.organization_name : nomePessoa) + (basico.credential ? `, ${texto(basico.credential)}` : ''),
        contato: ehEmpresa ? nomeBonito(responsavel) : '',
        categoria: texto(taxonomia.desc),
        telefone: telefoneEua(endereco.telephone_number),
        endereco: nomeBonito([endereco.address_1, endereco.address_2].filter(Boolean).join(', ')),
        cidade: nomeBonito(endereco.city),
        estado: texto(endereco.state),
        cep: cepEua(endereco.postal_code),
        extras: {
            npi: String(registro.number),
            tipo: ehEmpresa ? 'empresa' : 'pessoa',
            licenca: texto(taxonomia.license),
            desde: basico.enumeration_date ?? null,
        },
    }
}

export const fonteNpi = {
    id: 'npi',
    nome: 'NPI Registry',

    async buscar(filtrosBrutos) {
        const filtros = filtrosValidos(filtrosBrutos)
        const leads = []

        for (let pular = 0; leads.length < filtros.quantidade && pular <= 1000; pular += POR_PAGINA) {
            const params = new URLSearchParams({
                version: '2.1',
                taxonomy_description: filtros.especialidade,
                state: filtros.estado,
                limit: String(POR_PAGINA),
                skip: String(pular),
            })
            if (filtros.cidade) params.set('city', filtros.cidade)
            if (filtros.cep) params.set('postal_code', `${filtros.cep}*`)
            if (filtros.tipo) params.set('enumeration_type', filtros.tipo === 'empresa' ? 'NPI-2' : 'NPI-1')

            const dados = await buscarJson(`${URL_API}?${params}`, { nomeFonte: 'o NPI Registry' })
            if (dados?.Errors?.length) {
                throw new AppError(`O NPI Registry recusou a busca: ${dados.Errors[0].description}`, 400)
            }
            const resultados = dados?.results ?? []
            leads.push(...resultados.map((r) => paraLead(r, filtros.especialidade)))
            if (resultados.length < POR_PAGINA) break
        }

        return { filtros, leads: leads.slice(0, filtros.quantidade), requisicoesGoogle: 0 }
    },
}
