// Planilha CSV dos leads (abre no Excel e no Google Sheets). Cabeçalho no idioma da tela.
const COLUNAS = [
    ['nome', 'Nome', 'Name'],
    ['contato', 'Contato', 'Contact'],
    ['categoria', 'Categoria', 'Category'],
    ['telefone', 'Telefone', 'Phone'],
    ['email', 'E-mail', 'Email'],
    ['site', 'Site', 'Website'],
    ['instagram', 'Instagram', 'Instagram'],
    ['origem', 'Origem', 'Origin'],
    ['endereco', 'Endereço', 'Address'],
    ['cidade', 'Cidade', 'City'],
    ['estado', 'Estado', 'State'],
    ['cep', 'CEP', 'ZIP'],
    ['fonte', 'Fonte', 'Source'],
    ['status', 'Situação', 'Status'],
    ['numeroContatos', 'Nº de contatos', 'Contacts'],
    ['ultimoContatoEm', 'Último contato', 'Last contact'],
    ['proximoFollowUpEm', 'Próximo follow-up', 'Next follow-up'],
    ['observacao', 'Observação', 'Notes'],
]

// Aspas dobradas; e célula que começa com = + - @ ganha um apóstrofo para a planilha não executar fórmula.
function celula(valor) {
    let texto = String(valor ?? '')
    if (/^[=+\-@]/.test(texto)) texto = `'${texto}`
    return `"${texto.replace(/"/g, '""')}"`
}

export function leadsParaCsv(leads, idioma) {
    const cabecalho = COLUNAS.map(([, pt, en]) => celula(idioma === 'en' ? en : pt)).join(',')
    const linhas = leads.map((lead) => COLUNAS.map(([campo]) => celula(lead[campo] instanceof Date ? lead[campo].toISOString().slice(0, 10) : lead[campo])).join(','))
    // BOM no início: o Excel reconhece os acentos.
    return `﻿${[cabecalho, ...linhas].join('\r\n')}`
}
