import AppError from '../../../errors/AppError.js'
import CnpjModel from '../cnpj/cnpj.model.js'
import CnaeModel from '../cnpj/cnae.model.js'
import { CNAE_VALIDO, MAXIMO_DE_CNAES } from '../cnpj/cnpj.cnaes.js'
import { ultimaImportacao } from '../cnpj/cnpj.importar.js'
import { quantidadeValida } from './formatar.js'

// CNPJs abertos há pouco tempo no Brasil, nas atividades (CNAE) escolhidas (base aberta da Receita, importada todo
// mês: ver cnpj/). Traz telefone e, às vezes, e-mail (muitas vezes o do contador).
const MAXIMO = 500
const PERIODOS = [30, 60, 90]
export const UFS_BRASIL = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']

function escaparRegex(texto) {
    return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const MINUSCULAS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'para'])
const SIGLAS = new Set(['LTDA', 'ME', 'EPP', 'EIRELI', 'S/A', 'SA', 'SS', 'SLU'])

// "CLINICA SAO JOSE LTDA" -> "Clinica Sao Jose LTDA" (com acentos, quando a Receita manda com acento).
function nomeBonito(valor) {
    const limpo = String(valor ?? '').replace(/\s+/g, ' ').trim()
    if (!limpo || limpo !== limpo.toUpperCase()) return limpo
    return limpo.toLowerCase().replace(/[\p{L}\d/]+/gu, (palavra, posicao) => {
        if (SIGLAS.has(palavra.toUpperCase())) return palavra.toUpperCase()
        if (posicao > 0 && MINUSCULAS.has(palavra)) return palavra
        return palavra[0].toUpperCase() + palavra.slice(1)
    })
}

function cnpjFormatado(cnpj) {
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

// Razão social de MEI/empresário individual costuma ser "NOME DA PESSOA 12345678900": tira o CPF do fim.
function semDocumento(nome) {
    return nome.replace(/\s+\d{11}$/, '').trim()
}

function paraLead(r, atividades) {
    const razao = nomeBonito(semDocumento(r.razaoSocial))
    const nome = nomeBonito(r.fantasia) || razao || cnpjFormatado(r._id)
    return {
        idExterno: r._id,
        nome,
        contato: razao && razao !== nome ? razao : '',
        categoria: atividades[r.cnae] ?? '',
        telefone: r.telefone || r.telefone2,
        email: r.email,
        endereco: [nomeBonito(r.endereco), nomeBonito(r.bairro)].filter(Boolean).join(', '),
        cidade: nomeBonito(r.municipio),
        estado: r.uf,
        cep: r.cep.replace(/^(\d{5})(\d{3})$/, '$1-$2'),
        extras: { cnpj: cnpjFormatado(r._id), abertura: r.abertura, cnae: r.cnae },
    }
}

export const fonteCnpj = {
    id: 'cnpj',
    nome: 'CNPJs recém-abertos (Brasil)',
    // Na hora de salvar, telefone que a conta já tem também conta como repetido (ver captacao.service.js).
    conferirTelefone: true,

    async buscar(filtros) {
        const cnaes = [...new Set((Array.isArray(filtros.cnaes) ? filtros.cnaes : []).map(String).filter((cnae) => CNAE_VALIDO.test(cnae)))].slice(0, MAXIMO_DE_CNAES)
        if (!cnaes.length) throw new AppError('Escolha pelo menos uma atividade', 400)
        const uf = String(filtros.uf ?? '').toUpperCase()
        if (uf && !UFS_BRASIL.includes(uf)) throw new AppError('Escolha um estado válido', 400)
        const dias = PERIODOS.includes(Number(filtros.dias)) ? Number(filtros.dias) : 90
        const quantidade = quantidadeValida(filtros.quantidade, 100, MAXIMO)
        const cidade = String(filtros.cidade ?? '').trim()
        if (!(await ultimaImportacao())) throw new AppError('A base de CNPJs ainda está sendo baixada da Receita. Tente de novo mais tarde.', 503)

        const desde = new Date(Date.now() - dias * 86400000).toISOString().slice(0, 10)
        const consulta = { cnae: { $in: cnaes }, abertura: { $gte: desde } }
        if (uf) consulta.uf = uf
        if (cidade) consulta.municipio = new RegExp(`^${escaparRegex(cidade.normalize('NFD').replace(/[̀-ͯ]/g, ''))}$`, 'i')
        if (filtros.comTelefone !== false) consulta.$or = [{ telefone: { $ne: '' } }, { telefone2: { $ne: '' } }]

        const [registros, lista] = await Promise.all([
            CnpjModel.find(consulta).sort({ abertura: -1 }).limit(quantidade).lean(),
            CnaeModel.find({ _id: { $in: cnaes } }).lean(),
        ])
        const atividades = Object.fromEntries(lista.map((cnae) => [cnae._id, cnae.descricao]))
        return {
            leads: registros.map((registro) => paraLead(registro, atividades)),
            filtros: { cnaes, uf, cidade, dias, quantidade, comTelefone: filtros.comTelefone !== false },
            requisicoesGoogle: 0,
        }
    },
}
