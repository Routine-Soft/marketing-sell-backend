// Linhas da rotina diária (segunda a sexta), na ordem da grade. São as mesmas da planilha "Rotina de Marketing e Vendas".
// - sem tipo = tarefa: conta no % do dia. Com "auto", o sistema marca sozinho (contagem do dia chegou na meta,
//   ou, em 'followUp', não sobrou follow-up vencido).
// - tipo 'opcional': canal usado no dia; a pessoa marca, mas não conta no %.
// - tipo 'automatico': só mostra a contagem do dia (leads, primeiros contatos, follow-ups, parceiros).
// - dias: dias da semana em que vale (1 = segunda ... 5 = sexta); sem "dias" = todo dia útil.
export const META_LEADS = 30
export const META_CONTATOS = 30
export const META_PARCEIROS = 5

const SEG_QUA_SEX = [1, 3, 5]
const SEXTA = [5]

export const LINHAS = [
    { id: 'leads', bloco: 'leads', numero: 1, titulo: 'Pegar 30 leads novos e cadastrar na aba Leads', meta: META_LEADS, auto: 'leads' },
    { id: 'leads_cnpj', bloco: 'leads', tipo: 'opcional', titulo: 'CNPJs recém-abertos (saúde)' },
    { id: 'leads_google_maps', bloco: 'leads', tipo: 'opcional', titulo: 'Google Maps' },
    { id: 'leads_instagram', bloco: 'leads', tipo: 'opcional', titulo: 'Instagram' },
    { id: 'leads_doctoralia', bloco: 'leads', tipo: 'opcional', titulo: 'Doctoralia' },
    { id: 'leads_conselhos', bloco: 'leads', tipo: 'opcional', titulo: 'Sites dos conselhos (CRP, CREFITO, CRN…)' },
    { id: 'leads_no_dia', bloco: 'leads', tipo: 'automatico', titulo: 'Leads cadastrados no dia', meta: META_LEADS, contagem: 'leads' },

    { id: 'primeiro_contato', bloco: 'contato', numero: 2, titulo: 'Fazer o 1º contato com os 30 leads', meta: META_CONTATOS, auto: 'primeirosContatos' },
    { id: 'contato_ligacao', bloco: 'contato', tipo: 'opcional', titulo: 'Ligação' },
    { id: 'contato_whatsapp', bloco: 'contato', tipo: 'opcional', titulo: 'WhatsApp' },
    { id: 'contato_email', bloco: 'contato', tipo: 'opcional', titulo: 'E-mail' },
    { id: 'contato_dm', bloco: 'contato', tipo: 'opcional', titulo: 'DM no Instagram' },
    { id: 'contatos_no_dia', bloco: 'contato', tipo: 'automatico', titulo: 'Primeiros contatos no dia', meta: META_CONTATOS, contagem: 'primeirosContatos' },

    { id: 'follow_up', bloco: 'follow_up', numero: 3, titulo: 'Follow-up de quem está com data vencida (aba Leads)', auto: 'followUp' },
    { id: 'follow_ups_no_dia', bloco: 'follow_up', tipo: 'automatico', titulo: 'Follow-ups feitos no dia', contagem: 'followUps' },

    { id: 'video_vertical', bloco: 'video', numero: 4, titulo: 'Gravar 1 vídeo vertical', meta: 1 },
    { id: 'video_horizontal', bloco: 'video', numero: 5, titulo: 'Gravar 1 vídeo horizontal (YouTube)', meta: 1 },
    { id: 'postar_tiktok', bloco: 'video', numero: 6, titulo: 'Postar no TikTok' },
    { id: 'postar_instagram', bloco: 'video', numero: 7, titulo: 'Postar no Instagram (Reels)' },
    { id: 'postar_shorts', bloco: 'video', numero: 8, titulo: 'Postar no YouTube Shorts' },
    { id: 'postar_linkedin', bloco: 'video', numero: 9, titulo: 'Postar no LinkedIn' },
    { id: 'postar_x', bloco: 'video', numero: 10, titulo: 'Postar no X' },
    { id: 'postar_youtube', bloco: 'video', numero: 11, titulo: 'Postar o vídeo horizontal no YouTube' },
    { id: 'comentar_posts', bloco: 'video', numero: 12, titulo: 'Comentar em 5 posts de possíveis clientes', meta: 5 },

    { id: 'blog_escrever', bloco: 'blog', numero: 13, titulo: 'Escrever 1 artigo', meta: 1, dias: SEG_QUA_SEX },
    { id: 'blog_publicar', bloco: 'blog', numero: 14, titulo: 'Publicar (deploy)', dias: SEG_QUA_SEX },
    { id: 'blog_indexar', bloco: 'blog', numero: 15, titulo: 'Pedir indexação no Google Search Console', dias: SEG_QUA_SEX },

    { id: 'parceiros_pegar', bloco: 'parceiros', numero: 16, titulo: 'Pegar 5 leads de parceiros (aba Parceiros)', meta: META_PARCEIROS, auto: 'parceiros' },
    { id: 'parceiros_contadores', bloco: 'parceiros', tipo: 'opcional', titulo: 'Contadores' },
    { id: 'parceiros_influenciadores', bloco: 'parceiros', tipo: 'opcional', titulo: 'Influenciadores' },
    { id: 'parceiros_vendedores', bloco: 'parceiros', tipo: 'opcional', titulo: 'Vendedores autônomos' },
    { id: 'parceiros_mensagem', bloco: 'parceiros', numero: 17, titulo: 'Mandar mensagem / follow-up para parceiros', meta: 5 },
    { id: 'parceiros_no_dia', bloco: 'parceiros', tipo: 'automatico', titulo: 'Parceiros cadastrados no dia', meta: META_PARCEIROS, contagem: 'parceiros' },

    { id: 'comunidades', bloco: 'comunidades', numero: 18, titulo: 'Ajudar / responder em comunidades' },
    { id: 'comunidades_facebook', bloco: 'comunidades', tipo: 'opcional', titulo: 'Facebook' },
    { id: 'comunidades_whatsapp', bloco: 'comunidades', tipo: 'opcional', titulo: 'WhatsApp' },
    { id: 'comunidades_telegram', bloco: 'comunidades', tipo: 'opcional', titulo: 'Telegram' },
    { id: 'comunidades_discord', bloco: 'comunidades', tipo: 'opcional', titulo: 'Discord' },

    { id: 'atualizar_leads', bloco: 'fechamento', numero: 19, titulo: 'Atualizar status na aba Leads e olhar o Painel' },
    { id: 'revisar_semana', bloco: 'fechamento', numero: 20, titulo: 'Revisar os números da semana e ajustar a mensagem', dias: SEXTA },
    { id: 'pedir_indicacao', bloco: 'fechamento', numero: 21, titulo: 'Pedir indicação aos clientes atuais', dias: SEXTA },
].map((linha) => ({ tipo: 'tarefa', ...linha }))
