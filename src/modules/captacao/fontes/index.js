import { fonteNpi, ESPECIALIDADES_NPI } from './npi.fonte.js'
import { fonteGooglePlaces } from './google-places.fonte.js'
import { fonteEmpresasNovas, ESTADOS_EMPRESAS_NOVAS } from './empresas-novas.fonte.js'
import { fonteLicencas, ESTADOS_LICENCAS } from './licencas.fonte.js'
import { ESTADOS_EUA } from './formatar.js'

// Cada fonte de dados é uma "subfeature" da captação: recebe filtros e devolve leads no mesmo formato
// ({ idExterno, nome, contato, categoria, telefone, email, site, endereco, cidade, estado, cep, extras }).
// Fonte nova: um arquivo <nome>.fonte.js com { id, nome, buscar(filtros, contexto) } e uma linha aqui.
export const FONTES = {
    [fonteNpi.id]: fonteNpi,
    [fonteGooglePlaces.id]: fonteGooglePlaces,
    [fonteEmpresasNovas.id]: fonteEmpresasNovas,
    [fonteLicencas.id]: fonteLicencas,
}

// Listas que a tela usa para montar os formulários de cada fonte.
export const OPCOES_DAS_FONTES = {
    estadosEua: ESTADOS_EUA,
    npi: { especialidades: ESPECIALIDADES_NPI },
    empresas_novas: { estados: ESTADOS_EMPRESAS_NOVAS },
    licencas: { estados: ESTADOS_LICENCAS },
}
