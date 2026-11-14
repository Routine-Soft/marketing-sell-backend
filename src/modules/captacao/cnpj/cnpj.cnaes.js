// Atividades (CNAE fiscal principal, subclasse com 7 dígitos) que a importação sempre traz: as da saúde, que
// eram a base original. As outras entram quando algum negócio escolhe a atividade na Captação (cnaesCnpj).
export const CNAES_PADRAO = [
    '8650003', '8650004', '8650002', '8630504', '8630501', '8630502', '8630503', '8650006', '8650005', '8650001',
    '8690901', '8690903', '8690904', '8650099', '8630599', '8690999',
]

export const CNAE_VALIDO = /^\d{7}$/
// Quantas atividades um negócio pode guardar para a busca.
export const MAXIMO_DE_CNAES = 40

// Nomes populares que não aparecem na descrição oficial: entram na busca pelo nome (ex.: "academia" acha
// "Atividades de condicionamento físico"). Pode acrescentar à vontade.
export const APELIDOS_DE_CNAE = {
    8650003: 'psicologo psicologa terapeuta',
    8650004: 'fisioterapeuta pilates',
    8650002: 'nutricionista',
    8630504: 'dentista odontologia consultorio odontologico',
    8630503: 'medico consultorio medico',
    8650006: 'fonoaudiologo',
    9313100: 'academia ginastica crossfit musculacao personal',
    9602501: 'salao de beleza cabeleireiro barbearia manicure',
    9602502: 'estetica esteticista clinica de estetica',
    7500100: 'veterinario clinica veterinaria',
    9609208: 'pet shop banho e tosa',
    4789004: 'pet shop',
    5611201: 'restaurante',
    5611203: 'lanchonete',
    4771701: 'farmacia drogaria',
    6911701: 'advogado escritorio de advocacia',
    6920601: 'contador contabilidade escritorio contabil',
    8593700: 'escola de idiomas curso de ingles',
    8599604: 'treinamento curso',
    4781400: 'loja de roupas',
    6822600: 'imobiliaria',
    6821801: 'corretor de imoveis',
    7319002: 'marketing digital',
    7311400: 'agencia de publicidade',
    4520001: 'oficina mecanica',
    9511800: 'conserto de computador assistencia tecnica',
    9512600: 'conserto de celular assistencia tecnica',
    8011101: 'seguranca vigilancia',
    8121400: 'limpeza',
    4330404: 'pintor pintura',
    4321500: 'eletricista instalacao eletrica',
    4322301: 'encanador',
}
