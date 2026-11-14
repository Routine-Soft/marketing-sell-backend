// O "dia" da rotina, do lembrete e do painel é o dia de Brasília (sem horário de verão: sempre UTC-3).
const FUSO = '-03:00'
const DIA_MS = 24 * 60 * 60 * 1000

// 'AAAA-MM-DD' do dia de Brasília em que a data cai.
export function diaDe(data = new Date()) {
    return new Date(data.getTime() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

export function diaValido(texto) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(texto ?? '')) && !Number.isNaN(new Date(`${texto}T00:00:00${FUSO}`).getTime())
}

export function inicioDoDia(dia) {
    return new Date(`${dia}T00:00:00${FUSO}`)
}

export function fimDoDia(dia) {
    return new Date(inicioDoDia(dia).getTime() + DIA_MS)
}

// 0 = domingo ... 6 = sábado.
export function diaDaSemana(dia) {
    return new Date(`${dia}T12:00:00Z`).getUTCDay()
}

export function diaUtil(dia) {
    return ![0, 6].includes(diaDaSemana(dia))
}

export function somarDias(dia, quantidade) {
    return new Date(new Date(`${dia}T12:00:00Z`).getTime() + quantidade * DIA_MS).toISOString().slice(0, 10)
}

// Hora (0 a 23) de Brasília agora.
export function horaAgora() {
    return new Date(Date.now() - 3 * 60 * 60 * 1000).getUTCHours()
}
