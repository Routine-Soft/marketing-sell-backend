// Planilha CSV dos leads (abre no Excel e no Google Sheets). Cabeçalho no idioma da tela.
const COLUNAS = [
    ['nome', 'Nome', 'Name', 'Nombre'],
    ['contato', 'Contato', 'Contact', 'Contacto'],
    ['categoria', 'Categoria', 'Category', 'Categoría'],
    ['telefone', 'Telefone', 'Phone', 'Teléfono'],
    ['email', 'E-mail', 'Email', 'Correo'],
    ['site', 'Site', 'Website', 'Sitio web'],
    ['instagram', 'Instagram', 'Instagram', 'Instagram'],
    ['origem', 'Origem', 'Origin', 'Origen'],
    ['endereco', 'Endereço', 'Address', 'Dirección'],
    ['cidade', 'Cidade', 'City', 'Ciudad'],
    ['estado', 'Estado', 'State', 'Estado'],
    ['cep', 'CEP', 'ZIP', 'Código postal'],
    ['fonte', 'Fonte', 'Source', 'Fuente'],
    ['status', 'Situação', 'Status', 'Estado del lead'],
    ['numeroContatos', 'Nº de contatos', 'Contacts', 'N.º de contactos'],
    ['ultimoContatoEm', 'Último contato', 'Last contact', 'Último contacto'],
    ['proximoFollowUpEm', 'Próximo follow-up', 'Next follow-up', 'Próximo seguimiento'],
    ['observacao', 'Observação', 'Notes', 'Observaciones'],
]

// Aspas dobradas; e célula que começa com = + - @ ganha um apóstrofo para a planilha não executar fórmula.
function celula(valor) {
    let texto = String(valor ?? '')
    if (/^[=+\-@]/.test(texto)) texto = `'${texto}`
    return `"${texto.replace(/"/g, '""')}"`
}

export function leadsParaCsv(leads, idioma) {
    const cabecalho = COLUNAS.map(([, pt, en, es]) => celula({ en, es }[idioma] ?? pt)).join(',')
    const linhas = leads.map((lead) => COLUNAS.map(([campo]) => celula(lead[campo] instanceof Date ? lead[campo].toISOString().slice(0, 10) : lead[campo])).join(','))
    // BOM no início: o Excel reconhece os acentos.
    return `﻿${[cabecalho, ...linhas].join('\r\n')}`
}
