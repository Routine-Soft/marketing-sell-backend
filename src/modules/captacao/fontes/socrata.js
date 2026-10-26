import { buscarJson } from './formatar.js'

// Portais de dados abertos dos estados (data.ny.gov, data.texas.gov...) usam a plataforma Socrata:
// GET /resource/<dataset>.json com filtros em SoQL ($where, $order, $limit).
// SOCRATA_APP_TOKEN é opcional e só aumenta o limite de requisições.
export async function consultarSocrata({ dominio, dataset, where, ordem, limite, nomeFonte }) {
    const params = new URLSearchParams({ $limit: String(limite) })
    if (where.length) params.set('$where', where.join(' AND '))
    if (ordem) params.set('$order', ordem)

    const headers = process.env.SOCRATA_APP_TOKEN ? { 'X-App-Token': process.env.SOCRATA_APP_TOKEN } : {}
    const dados = await buscarJson(`https://${dominio}/resource/${dataset}.json?${params}`, { nomeFonte, headers })
    return Array.isArray(dados) ? dados : []
}

// Texto digitado pela pessoa dentro de uma expressão SoQL: aspas simples dobradas.
export function textoSoql(valor) {
    return String(valor).toUpperCase().replace(/'/g, "''")
}
