# Marketing Sell: captação de clientes nos EUA

Dois repositórios irmãos em `~/Repositorios/`: **`marketing-sell-backend`** (este, API) e **`marketing-sell-frontend`** (sistema web). As conversas abrem aqui com o frontend como pasta adicional.

- Multi-tenant, bilíngue (português e inglês). Sem pagamento por enquanto.
- **Backend no VPS da OVH** (desde 2026-11-09): container `marketingsell` (384 MB), API em `https://api-marketingsell.sonelia.com.br` (DNS no Registro.br), saúde em `/api/saude`. Atualizar: `~/atualizar.sh marketingsell` (ver skill `deploy-servidor`). Cadastrado no ServerFall como "Marketing Sell". As filas de envio e de busca de e-mail rodam lá: não deixe o backend local ligado ao mesmo tempo. Banco: cluster `saas` do Atlas (o mesmo do Manage System), banco `marketingsell` (ver `src/db/db.js`). **O `.env` local aponta para esse banco real.**

## Multi-tenant e papéis
- O dono da conta é um `users` com `role: 'admin'` e `tenantId` = o próprio `_id`. Todo documento tem `tenantId`; o token traz `tenantId`.
- Papéis: `super_admin` (o Stanley), `admin` (dono da empresa), `membro` (equipe; ainda sem tela para criar).

## Backend (`src/modules/`)
- `user`: cadastro, login, refresh, minha conta; `conta-admin.service.js` = painel do super admin (contas, cota do Google, excluir conta).
- `captacao`: busca nas fontes (`busca.model.js` guarda cada busca; é a base da cota do Google, sem tela de histórico). `captacao.cota.js` = cota mensal de páginas do Google por conta (`cotaGoogleMensal` no dono ou `GOOGLE_COTA_MENSAL`).
  - `fontes/`: cada fonte é uma subfeature com `{ id, nome, buscar(filtros, contexto) }`, registrada em `fontes/index.js`. Todas devolvem leads no mesmo formato.
    - `npi`: NPI Registry (CMS), profissionais de saúde. Cobre APTA/AMTA/ACA (essas associações não têm API).
    - `google`: Google Places API (New), Text Search. Única fonte paga (chave do sistema em `GOOGLE_API_KEY`).
    - `empresas_novas`: Secretaria de Estado via dados abertos Socrata (CO, CT, NY, OR). Estado novo = item em `ESTADOS`.
    - `licencas`: TDLR do Texas (data.texas.gov), prestadores com telefone. Só licenças de estabelecimento/empresa trazem telefone.
- **Só e-mails do Gmail ou do Yahoo** (`shared/utils/provedor-email.js`): lead da fonte com outro e-mail é descartado na busca, e a busca no site só aceita Gmail/Yahoo. Na lista, `comEmail=gmail_yahoo` filtra.
- `lead`: lista, filtros, edição, exclusão, exportação CSV. Sem repetição: índice único `tenantId + fonte + idExterno`; lead que já existe não é sobrescrito.
- `email-site`: procura e-mail no site do lead. Fila no próprio banco (`emailStatus: na_fila → buscando → encontrado/nao_encontrado`), processada por `email-site.fila.js` (sobe com o servidor). O extrator bloqueia IPs internos.
- `remetente`: um por negócio da conta (ex.: Sonélia, Stanley Andrade), com Gmail + **senha de app** (criptografada com `EMAIL_CRYPTO_KEY`, nunca volta na API), `assuntoPadrao`, `corpoPadrao`, `rodape` (CAN-SPAM: endereço físico + como sair da lista) e `ativo`. Só `admin`/`super_admin`. "Enviar teste" sai na hora com um lead de exemplo.
- `envio`: e-mail para leads via **SMTP do Gmail** (nodemailer; sem serviço pago, uso pessoal).
  - `envio.model.js` = cada e-mail (teste ou lead), `status: na_fila → enviando → enviado/erro`; é também a base da cota.
  - `envio.cota.js`: limite **por Gmail, não por remetente** (dois negócios no mesmo Gmail somam), `GMAIL_LIMITE_DIARIO` (padrão 500), dia em UTC.
  - `envio.fila.js` (sobe com o servidor): um e-mail por Gmail a cada 30–60 s; passou do limite, espera o dia seguinte; se o próprio Gmail recusar por limite, grava a pausa em `pausa-gmail.model.js` (vale após reinício e aparece no cartão "Envios de hoje" com a resposta do Gmail); senha recusada (`EAUTH`) marca erro em toda a fila do remetente.
  - `envio.template.js`: `{nome}`, `{contato}`, `{cidade}` (escapados) e rodapé no fim. Texto com HTML de bloco (`<p>`, `<br>`, `<div>`...) é usado como está; só texto simples tem as quebras de linha viradas em `<br>`.
  - Rotas: `POST /envios/previa`, `POST /envios` (não reenvia ao mesmo lead pelo mesmo negócio sem `reenviar: true`), `POST /envios/cancelar`.
  - No lead: `envioPendente`, `ultimoEnvioEm`, `ultimoEnvioNegocio`, `envioErro`; lead "novo" vira "contatado" ao receber.
- **Follow-up** (veio da planilha "Sonélia — Rotina de Marketing e Vendas"):
  - No lead: `primeiroContatoEm`, `canalPrimeiroContato`, `ultimoContatoEm`, `numeroContatos`, `proximoFollowUpEm`, `respondeuEm`. Situações: `novo → contatado → respondeu → interessado → demo → teste_gratis → cliente`; `descartado` = perdido.
  - `lead/lead.contato.js`: `registrarContato` (conta o contato, grava em `contato.model.js` e marca o próximo follow-up: 3, 7 e 14 dias depois do primeiro; 4 contatos sem resposta = "para encerrar") e `pararFollowUp`. Rota `POST /leads/:id/contatos { canal }`; e-mail enviado pela fila também conta como contato. Lista: `followUp=vencido|encerrar`.
  - `follow-up/` (sobe com o servidor, `follow-up.rotinas.js`): lembrete no **Telegram** às 8h de Brasília em dia útil (`follow-up.lembrete.js`, um por conta por dia via `aviso.model.js`); follow-up automático por e-mail (`follow-up.email.js`: textos `followUps` do remetente com `followUpAtivo`, só para quem recebeu o 1º e-mail daquele negócio, dia útil das 9h às 18h); leitura de respostas por IMAP com a mesma senha de app (`follow-up.respostas.js`: lead vira `respondeu`, follow-ups param, aviso no Telegram).
  - Telegram: `shared/utils/telegram.js`, bot em `TELEGRAM_BOT_TOKEN` (o mesmo do Sonelia). Destino = `telegramChatId` do dono da conta (Minha conta); o super admin cai em `TELEGRAM_CHAT_ID`.
- **O sistema tem a cara da planilha** "Sonélia — Rotina de Marketing e Vendas" (pedido do Stanley em 2026-11-13): cada aba da planilha é uma tela, com grade, cabeçalho na cor da aba e células coloridas pelo estado.
- `rotina`: grade da rotina diária, segunda a sexta. `rotina.tarefas.js` = `LINHAS` fixas, na ordem da planilha: tarefa (conta no %; com `auto`, o sistema marca sozinho pela contagem do dia), `opcional` (canal usado, não conta) e `automatico` (só mostra a contagem). `rotina-dia.model.js` = o que foi marcado. `GET /rotina/grade?de=&ate=` (padrão: semana atual e a seguinte; `inicio` = primeiro dia de uso, antes dele nada fica vermelho), `PATCH /rotina/:dia { linhaId, feita }`, `GET /rotina/painel` (hoje, semana, funil, constância, parceiros). Dia = dia de Brasília (`shared/utils/dia.js`).
- `parceiro` (aba Parceiros), `comunidade` (aba Comunidades e eventos) e `checklist` (abas Preparação e Anúncios: `GET/POST /checklists/:lista`, `PATCH/DELETE /checklists/itens/:id`; a lista nasce com os itens de `checklist.padrao.js` e isso fica anotado em `checklistsCriadas` do dono). As telas salvam uma célula por vez: os DTOs só leem os campos enviados (`shared/utils/campos.js`).
- Lead cadastrado à mão: `POST /leads { nome, ... }` (`fonte: 'manual'`, campos `instagram` e `origem`).
- `SEM_ROTINAS=1` sobe só a API, sem as filas e os lembretes (para testar no computador com o servidor ligado).
- Excluir conta (super admin) apaga também remetentes, envios, contatos, rotina, avisos, parceiros, comunidades e checklists.
- `shared`: middlewares (`authenticate`, `authorize`), `idioma.js` + `mensagens.en.js` (mensagem nova da API = tradução nova lá).
- Registrar módulo novo em `index.js` (`fastify.register(xRoutes, { prefix: '/api' })`).

## Frontend (`../marketing-sell-frontend/src/`)
- Base copiada do Sonelia (tema claro/rosa/escuro com marca índigo, `ui.css`, Modal, CampoSenha, Sidebar, PWA).
- **Visual de planilha**: `styles/planilha.css` (classes `.plan`, `.plan-wrap`, `.plan-titulo`, uma rolagem só: a página rola na vertical e a grade só rola para o lado quando não cabe; estados `data-estado="feito|falta|inativo|aviso|destaque|info"`, cores `--aba-*`), `components/Sidebar/abas.js` (as abas da planilha no menu lateral, com a cor de cada uma; não há barra de abas embaixo) e `components/Planilha` (`Planilha.jsx` = tabela editável com linha nova no fim, `Celulas.jsx`, `TelaDePlanilha.jsx`). Aba nova = item em `abas.js` + rota + tela com `TelaDePlanilha`.
- Abas: `/home` = Rotina diária (`modules/rotina/components/RotinaDiaria.jsx`, grade tarefas × dias), `/painel` (`Painel.jsx`), `/leads` (planilha com as colunas da aba Leads, linha nova no topo, coluna do nome fixa), `/parceiros`, `/preparacao` e `/anuncios` (`modules/checklist`), `/comunidades`. `hooks/useLista.js` serve as abas simples.
- Fora das abas (menu "Ferramentas" e "Conta"): `modules/captacao` (Buscar leads), `modules/remetente` (cartão "Envios de hoje" com barra por Gmail e cancelar fila), `modules/envio` (`EnviarEmailModal`, aberto pela barra de selecionados em Leads), `modules/user`.
- `.card` do `ui.css` não tem padding: cada tela define o seu. Textarea usa `className="input textarea"`.
- Textos: `tr('texto em português')`; inglês em `src/i18n/en.js`.
- `.npmrc` com `legacy-peer-deps` (o npm 10 falha nas dependências opcionais do Vite sem isso).
- Checagem rápida: `npx eslint src` e `npx vite build`.
