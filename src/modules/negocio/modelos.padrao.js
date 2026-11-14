// Modelos prontos de negócio: rotina diária (blocos e tarefas), abas visíveis e as listas de preparação e anúncios.
// Quem cria um negócio escolhe um modelo; o negócio recebe uma cópia e pode mudar tudo depois.
//
// Linhas da rotina:
// - tipo 'tarefa': conta no % do dia. Com "auto", o sistema marca sozinho: 'leads', 'primeirosContatos' e 'parceiros'
//   quando a contagem do dia chega na meta; 'followUp' quando não sobra follow-up vencido.
// - tipo 'opcional': canal usado no dia; a pessoa marca, mas não conta no %.
// - tipo 'automatico': só mostra a contagem do dia ("contagem": leads, primeirosContatos, followUps ou parceiros).
// - dias: dias da semana em que vale (1 = segunda ... 5 = sexta); vazio = todo dia útil.
// Os ids das linhas e dos blocos ficam gravados no que foi marcado em cada dia: não troque os do modelo da planilha.

export const ABAS = ['painel', 'leads', 'parceiros', 'preparacao', 'comunidades', 'anuncios']
export const CONTAGENS = ['leads', 'primeirosContatos', 'followUps', 'parceiros']
export const AUTOS = ['leads', 'primeirosContatos', 'parceiros', 'followUp']

const SEG_QUA_SEX = [1, 3, 5]
const SEXTA = [5]

const BLOCOS_DA_PLANILHA = [
    { id: 'leads', nome: '1. Leads', cor: '#2a7de1' },
    { id: 'contato', nome: '2. Contato', cor: '#19a568' },
    { id: 'follow_up', nome: '3. Follow-up', cor: '#e08a12' },
    { id: 'video', nome: '4. Vídeo', cor: '#d9447f' },
    { id: 'blog', nome: '5. Blog', cor: '#7646d8' },
    { id: 'parceiros', nome: '6. Parceiros', cor: '#c2710c' },
    { id: 'comunidades', nome: '7. Comunidades', cor: '#1fa5b3' },
    { id: 'fechamento', nome: '8. Fechamento', cor: '#64748b' },
]

const LINHAS_DA_PLANILHA = [
    { id: 'leads', bloco: 'leads', titulo: 'Pegar 30 leads novos e cadastrar na aba Leads', meta: 30, auto: 'leads' },
    { id: 'leads_cnpj', bloco: 'leads', tipo: 'opcional', titulo: 'CNPJs recém-abertos (saúde)' },
    { id: 'leads_google_maps', bloco: 'leads', tipo: 'opcional', titulo: 'Google Maps' },
    { id: 'leads_instagram', bloco: 'leads', tipo: 'opcional', titulo: 'Instagram' },
    { id: 'leads_doctoralia', bloco: 'leads', tipo: 'opcional', titulo: 'Doctoralia' },
    { id: 'leads_conselhos', bloco: 'leads', tipo: 'opcional', titulo: 'Sites dos conselhos (CRP, CREFITO, CRN…)' },
    { id: 'leads_no_dia', bloco: 'leads', tipo: 'automatico', titulo: 'Leads cadastrados no dia', meta: 30, contagem: 'leads' },

    { id: 'primeiro_contato', bloco: 'contato', titulo: 'Fazer o 1º contato com os 30 leads', meta: 30, auto: 'primeirosContatos' },
    { id: 'contato_ligacao', bloco: 'contato', tipo: 'opcional', titulo: 'Ligação' },
    { id: 'contato_whatsapp', bloco: 'contato', tipo: 'opcional', titulo: 'WhatsApp' },
    { id: 'contato_email', bloco: 'contato', tipo: 'opcional', titulo: 'E-mail' },
    { id: 'contato_dm', bloco: 'contato', tipo: 'opcional', titulo: 'DM no Instagram' },
    { id: 'contatos_no_dia', bloco: 'contato', tipo: 'automatico', titulo: 'Primeiros contatos no dia', meta: 30, contagem: 'primeirosContatos' },

    { id: 'follow_up', bloco: 'follow_up', titulo: 'Follow-up de quem está com data vencida (aba Leads)', auto: 'followUp' },
    { id: 'follow_ups_no_dia', bloco: 'follow_up', tipo: 'automatico', titulo: 'Follow-ups feitos no dia', contagem: 'followUps' },

    { id: 'video_vertical', bloco: 'video', titulo: 'Gravar 1 vídeo vertical', meta: 1 },
    { id: 'video_horizontal', bloco: 'video', titulo: 'Gravar 1 vídeo horizontal (YouTube)', meta: 1 },
    { id: 'postar_tiktok', bloco: 'video', titulo: 'Postar no TikTok' },
    { id: 'postar_instagram', bloco: 'video', titulo: 'Postar no Instagram (Reels)' },
    { id: 'postar_shorts', bloco: 'video', titulo: 'Postar no YouTube Shorts' },
    { id: 'postar_linkedin', bloco: 'video', titulo: 'Postar no LinkedIn' },
    { id: 'postar_x', bloco: 'video', titulo: 'Postar no X' },
    { id: 'postar_youtube', bloco: 'video', titulo: 'Postar o vídeo horizontal no YouTube' },
    { id: 'comentar_posts', bloco: 'video', titulo: 'Comentar em 5 posts de possíveis clientes', meta: 5 },

    { id: 'blog_escrever', bloco: 'blog', titulo: 'Escrever 1 artigo', meta: 1, dias: SEG_QUA_SEX },
    { id: 'blog_publicar', bloco: 'blog', titulo: 'Publicar (deploy)', dias: SEG_QUA_SEX },
    { id: 'blog_indexar', bloco: 'blog', titulo: 'Pedir indexação no Google Search Console', dias: SEG_QUA_SEX },

    { id: 'parceiros_pegar', bloco: 'parceiros', titulo: 'Pegar 5 leads de parceiros (aba Parceiros)', meta: 5, auto: 'parceiros' },
    { id: 'parceiros_contadores', bloco: 'parceiros', tipo: 'opcional', titulo: 'Contadores' },
    { id: 'parceiros_influenciadores', bloco: 'parceiros', tipo: 'opcional', titulo: 'Influenciadores' },
    { id: 'parceiros_vendedores', bloco: 'parceiros', tipo: 'opcional', titulo: 'Vendedores autônomos' },
    { id: 'parceiros_mensagem', bloco: 'parceiros', titulo: 'Mandar mensagem / follow-up para parceiros', meta: 5 },
    { id: 'parceiros_no_dia', bloco: 'parceiros', tipo: 'automatico', titulo: 'Parceiros cadastrados no dia', meta: 5, contagem: 'parceiros' },

    { id: 'comunidades', bloco: 'comunidades', titulo: 'Ajudar / responder em comunidades' },
    { id: 'comunidades_facebook', bloco: 'comunidades', tipo: 'opcional', titulo: 'Facebook' },
    { id: 'comunidades_whatsapp', bloco: 'comunidades', tipo: 'opcional', titulo: 'WhatsApp' },
    { id: 'comunidades_telegram', bloco: 'comunidades', tipo: 'opcional', titulo: 'Telegram' },
    { id: 'comunidades_discord', bloco: 'comunidades', tipo: 'opcional', titulo: 'Discord' },

    { id: 'atualizar_leads', bloco: 'fechamento', titulo: 'Atualizar status na aba Leads e olhar o Painel' },
    { id: 'revisar_semana', bloco: 'fechamento', titulo: 'Revisar os números da semana e ajustar a mensagem', dias: SEXTA },
    { id: 'pedir_indicacao', bloco: 'fechamento', titulo: 'Pedir indicação aos clientes atuais', dias: SEXTA },
]

const LISTAS_DA_PLANILHA = {
    preparacao: [
        ['Contato', 'Separar um número de WhatsApp Business só para a empresa', 'Evita banimento do seu número pessoal'],
        ['Contato', 'Criar e-mail profissional (com o domínio da empresa)', 'E-mail com domínio passa mais confiança e cai menos no spam'],
        ['Contato', 'Escrever script de ligação', 'Abertura, pergunta, oferta da demo de 10 min'],
        ['Contato', 'Escrever script de WhatsApp', 'Curto, citando algo real do consultório'],
        ['Contato', 'Escrever script de e-mail', 'Assunto + 4 linhas + pergunta de sim ou não'],
        ['Contato', 'Escrever script de DM no Instagram', ''],
        ['Contato', 'Escrever mensagens de follow-up (2º, 3º e 4º contato)', ''],
        ['Leads', 'Definir onde pegar CNPJs recém-abertos da saúde', 'Fonte e filtro (CNAE de saúde, data de abertura)'],
        ['Vídeo', 'Arrumar perfil do TikTok', 'Bio + link para o teste grátis'],
        ['Vídeo', 'Arrumar perfil do Instagram', 'Bio + link para o teste grátis'],
        ['Vídeo', 'Arrumar canal do YouTube', ''],
        ['Vídeo', 'Arrumar perfil do LinkedIn', ''],
        ['Vídeo', 'Arrumar perfil do X', ''],
        ['Vídeo', 'Lista com 30 ideias de vídeo', 'Formato: problema do profissional de saúde + como resolver'],
        ['Blog', 'Criar o blog (ex: sonelia.com.br/blog)', ''],
        ['Blog', 'Configurar o Google Search Console e enviar o sitemap', 'Necessário para pedir indexação'],
        ['Blog', 'Lista com 30 pautas de artigo', 'Ex: como organizar a agenda do consultório'],
        ['Landing pages', 'Landing page para psicólogo', ''],
        ['Landing pages', 'Landing page para clínica multidisciplinar', ''],
        ['Material grátis', 'Escolher o material', 'Ex: checklist para abrir consultório, planilha financeira do consultório'],
        ['Material grátis', 'Criar o material', ''],
        ['Material grátis', 'Criar página com formulário (nome, e-mail, WhatsApp) para baixar', 'Quem baixar vira lead (origem: Material grátis)'],
        ['Material grátis', 'Divulgar o material nos vídeos, blog e comunidades', ''],
        ['Parceiros', 'Definir a comissão do parceiro', ''],
        ['Parceiros', 'Criar o link rastreável por parceiro', ''],
        ['Parceiros', 'Criar mensagem e material para apresentar aos parceiros', ''],
        ['Comunidades', 'Pesquisar e entrar em grupos do Facebook', 'Registrar na aba Comunidades e eventos'],
        ['Comunidades', 'Pesquisar e entrar em grupos de WhatsApp', 'Registrar na aba Comunidades e eventos'],
        ['Comunidades', 'Pesquisar e entrar em grupos do Telegram', 'Registrar na aba Comunidades e eventos'],
        ['Comunidades', 'Pesquisar e entrar em servidores do Discord', 'Registrar na aba Comunidades e eventos'],
        ['Eventos', 'Pesquisar eventos e congressos da área (psicologia, fisio, nutrição…)', 'Registrar na aba Comunidades e eventos'],
        ['Eventos', 'Pesquisar associações e conselhos regionais', 'Registrar na aba Comunidades e eventos'],
        ['Eventos', 'Se inscrever nos eventos escolhidos', ''],
    ],
    anuncios: [
        ['Google Ads', 'Criar conta no Google Ads', ''],
        ['Google Ads', 'Configurar conversão (cadastro no teste grátis)', ''],
        ['Google Ads', 'Escolher palavras-chave (ex: sistema para consultório, agenda para psicólogo)', ''],
        ['Google Ads', 'Escrever o anúncio e apontar para a landing page do nicho', ''],
        ['Google Ads', 'Definir orçamento diário', ''],
        ['Google Ads', 'Publicar a campanha', ''],
        ['Meta (Instagram/Facebook)', 'Criar o Business Manager e a conta de anúncios', ''],
        ['Meta (Instagram/Facebook)', 'Instalar o Pixel da Meta no site', ''],
        ['Meta (Instagram/Facebook)', 'Definir o público (profissões da saúde, região)', ''],
        ['Meta (Instagram/Facebook)', 'Escolher o criativo (reaproveitar o vídeo vertical que performou melhor)', ''],
        ['Meta (Instagram/Facebook)', 'Definir orçamento diário', ''],
        ['Meta (Instagram/Facebook)', 'Publicar a campanha', ''],
    ],
}

function linha(dados) {
    return { tipo: 'tarefa', meta: null, auto: '', contagem: '', dias: [], ...dados }
}

const paraItens = (lista) => lista.map(([grupo, tarefa, detalhe]) => ({ grupo, tarefa, detalhe }))

export const MODELOS_DO_SISTEMA = [
    {
        id: 'marketing_vendas',
        nome: 'Marketing e vendas (completo)',
        descricao: 'A rotina da planilha "Rotina de Marketing e Vendas": leads, contato, follow-up, vídeo, blog, parceiros, comunidades e fechamento.',
        abas: ABAS,
        rotina: { blocos: BLOCOS_DA_PLANILHA, linhas: LINHAS_DA_PLANILHA.map(linha) },
        listas: { preparacao: paraItens(LISTAS_DA_PLANILHA.preparacao), anuncios: paraItens(LISTAS_DA_PLANILHA.anuncios) },
    },
    {
        id: 'prospeccao_simples',
        nome: 'Prospecção simples',
        descricao: 'Para qualquer negócio que vende por contato direto: leads, 1º contato, follow-up, redes sociais e fechamento.',
        abas: ['painel', 'leads', 'preparacao'],
        rotina: {
            blocos: [
                { id: 'leads', nome: '1. Leads', cor: '#2a7de1' },
                { id: 'contato', nome: '2. Contato', cor: '#19a568' },
                { id: 'follow_up', nome: '3. Follow-up', cor: '#e08a12' },
                { id: 'redes', nome: '4. Redes sociais', cor: '#d9447f' },
                { id: 'fechamento', nome: '5. Fechamento', cor: '#64748b' },
            ],
            linhas: [
                { id: 'leads', bloco: 'leads', titulo: 'Pegar 20 leads novos', meta: 20, auto: 'leads' },
                { id: 'leads_no_dia', bloco: 'leads', tipo: 'automatico', titulo: 'Leads cadastrados no dia', meta: 20, contagem: 'leads' },
                { id: 'primeiro_contato', bloco: 'contato', titulo: 'Fazer o 1º contato com 20 leads', meta: 20, auto: 'primeirosContatos' },
                { id: 'contato_ligacao', bloco: 'contato', tipo: 'opcional', titulo: 'Ligação' },
                { id: 'contato_whatsapp', bloco: 'contato', tipo: 'opcional', titulo: 'WhatsApp' },
                { id: 'follow_up', bloco: 'follow_up', titulo: 'Follow-up de quem está com data vencida', auto: 'followUp' },
                { id: 'postar', bloco: 'redes', titulo: 'Postar 1 conteúdo', meta: 1 },
                { id: 'comentar_posts', bloco: 'redes', titulo: 'Comentar em 5 posts de possíveis clientes', meta: 5 },
                { id: 'atualizar_leads', bloco: 'fechamento', titulo: 'Atualizar status dos leads e olhar o Painel' },
                { id: 'revisar_semana', bloco: 'fechamento', titulo: 'Revisar os números da semana', dias: SEXTA },
            ].map(linha),
        },
        listas: {
            preparacao: [
                { grupo: 'Contato', tarefa: 'Escrever script de ligação', detalhe: '' },
                { grupo: 'Contato', tarefa: 'Escrever script de WhatsApp', detalhe: '' },
                { grupo: 'Contato', tarefa: 'Escrever mensagens de follow-up (2º, 3º e 4º contato)', detalhe: '' },
                { grupo: 'Leads', tarefa: 'Definir onde pegar os leads', detalhe: '' },
            ],
            anuncios: [],
        },
    },
    {
        id: 'em_branco',
        nome: 'Em branco',
        descricao: 'Comece do zero e monte os seus blocos e tarefas.',
        abas: ['painel', 'leads'],
        rotina: { blocos: [{ id: 'tarefas', nome: 'Tarefas', cor: '#2a7de1' }], linhas: [] },
        listas: { preparacao: [], anuncios: [] },
    },
]

export const MODELO_PADRAO = MODELOS_DO_SISTEMA[0]
