import AppError from '../../../errors/AppError.js'
import { buscarJson, cepEua, quantidadeValida, texto } from './formatar.js'

// Google Places API (New), busca por texto: "massage therapist in Santa Monica, CA". Serve para qualquer nicho.
// Cada página (até 20 lugares) é uma requisição cobrada pelo Google; por isso conta na cota mensal da conta.
// Documentação: https://developers.google.com/maps/documentation/places/web-service/text-search
const URL_API = 'https://places.googleapis.com/v1/places:searchText'
const CAMPOS = [
    'places.id',
    'places.displayName',
    'places.formattedAddress',
    'places.addressComponents',
    'places.nationalPhoneNumber',
    'places.websiteUri',
    'places.businessStatus',
    'places.primaryTypeDisplayName',
    'places.rating',
    'places.userRatingCount',
    'nextPageToken',
].join(',')
// O Google entrega no máximo 3 páginas por busca.
const MAX_PAGINAS = 3

function filtrosValidos(filtros) {
    const termo = texto(filtros.termo)
    const local = texto(filtros.local)
    if (!termo || !local) throw new AppError('Informe o que procurar e a cidade', 400)
    return { termo, local, paginas: quantidadeValida(filtros.paginas, MAX_PAGINAS, MAX_PAGINAS) }
}

function componente(lugar, tipo, curto = false) {
    const item = lugar.addressComponents?.find((c) => c.types?.includes(tipo))
    return texto(curto ? item?.shortText : item?.longText)
}

function paraLead(lugar) {
    return {
        idExterno: lugar.id,
        nome: texto(lugar.displayName?.text),
        categoria: texto(lugar.primaryTypeDisplayName?.text),
        telefone: texto(lugar.nationalPhoneNumber),
        site: texto(lugar.websiteUri),
        endereco: texto(lugar.formattedAddress),
        cidade: componente(lugar, 'locality') || componente(lugar, 'sublocality'),
        estado: componente(lugar, 'administrative_area_level_1', true),
        cep: cepEua(componente(lugar, 'postal_code')),
        extras: {
            nota: lugar.rating ?? null,
            avaliacoes: lugar.userRatingCount ?? null,
        },
    }
}

export const fonteGooglePlaces = {
    id: 'google',
    nome: 'Google Places',

    // `paginasDisponiveis`: o que sobra da cota do mês (ver captacao.cota.js).
    async buscar(filtrosBrutos, { paginasDisponiveis }) {
        const filtros = filtrosValidos(filtrosBrutos)
        const apiKey = process.env.GOOGLE_API_KEY
        if (!apiKey) throw new AppError('A busca no Google não está configurada. Fale com o suporte.', 503)

        const paginas = Math.min(filtros.paginas, paginasDisponiveis)
        const leads = []
        let requisicoesGoogle = 0
        let pageToken

        for (let pagina = 0; pagina < paginas; pagina++) {
            const corpo = { textQuery: `${filtros.termo} in ${filtros.local}`, pageSize: 20, languageCode: 'en' }
            if (pageToken) corpo.pageToken = pageToken

            const dados = await buscarJson(URL_API, {
                nomeFonte: 'o Google',
                metodo: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': CAMPOS },
                corpo: JSON.stringify(corpo),
            })
            requisicoesGoogle++

            for (const lugar of dados?.places ?? []) {
                if (lugar.businessStatus && lugar.businessStatus !== 'OPERATIONAL') continue
                leads.push(paraLead(lugar))
            }
            pageToken = dados?.nextPageToken
            if (!pageToken) break
        }

        return { filtros, leads, requisicoesGoogle }
    },
}
