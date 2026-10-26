# Marketing Sell: captação de clientes nos EUA

Dois repositórios irmãos em `~/Repositorios/`: **`marketing-sell-backend`** (este, API) e **`marketing-sell-frontend`** (sistema web). As conversas abrem aqui com o frontend como pasta adicional.

- Multi-tenant, bilíngue (português e inglês). Sem pagamento por enquanto.
- Ainda não publicado (sem servidor nem domínio). Banco: cluster `saas` do Atlas (o mesmo do Manage System), banco `marketingsell` (ver `src/db/db.js`). **O `.env` local aponta para esse banco real.**

## Multi-tenant e papéis
- O dono da conta é um `users` com `role: 'admin'` e `tenantId` = o próprio `_id`. Todo documento tem `tenantId`; o token traz `tenantId`.
- Papéis: `super_admin` (o Stanley), `admin` (dono da empresa), `membro` (equipe; ainda sem tela para criar).

## Backend (`src/modules/`)
- `user`: cadastro, login, refresh, minha conta; `conta-admin.service.js` = painel do super admin (contas, cota do Google, excluir conta).
- `captacao`: busca nas fontes e histórico (`busca.model.js`). `captacao.cota.js` = cota mensal de páginas do Google por conta (`cotaGoogleMensal` no dono ou `GOOGLE_COTA_MENSAL`).
  - `fontes/`: cada fonte é uma subfeature com `{ id, nome, buscar(filtros, contexto) }`, registrada em `fontes/index.js`. Todas devolvem leads no mesmo formato.
    - `npi`: NPI Registry (CMS), profissionais de saúde. Cobre APTA/AMTA/ACA (essas associações não têm API).
    - `google`: Google Places API (New), Text Search. Única fonte paga (chave do sistema em `GOOGLE_API_KEY`).
    - `empresas_novas`: Secretaria de Estado via dados abertos Socrata (CO, CT, NY, OR). Estado novo = item em `ESTADOS`.
    - `licencas`: TDLR do Texas (data.texas.gov), prestadores com telefone. Só licenças de estabelecimento/empresa trazem telefone.
- `lead`: lista, filtros, edição, exclusão, exportação CSV. Sem repetição: índice único `tenantId + fonte + idExterno`; lead que já existe não é sobrescrito.
- `email-site`: procura e-mail no site do lead. Fila no próprio banco (`emailStatus: na_fila → buscando → encontrado/nao_encontrado`), processada por `email-site.fila.js` (sobe com o servidor). O extrator bloqueia IPs internos.
- `remetente`: um por negócio da conta (ex.: Sonélia, Stanley Andrade), com Gmail + **senha de app** (criptografada com `EMAIL_CRYPTO_KEY`, nunca volta na API), `assuntoPadrao`, `corpoPadrao`, `rodape` (CAN-SPAM: endereço físico + como sair da lista) e `ativo`. Só `admin`/`super_admin`. "Enviar teste" sai na hora com um lead de exemplo.
- `envio`: e-mail para leads via **SMTP do Gmail** (nodemailer; sem serviço pago, uso pessoal).
  - `envio.model.js` = cada e-mail (teste ou lead), `status: na_fila → enviando → enviado/erro`; é também a base da cota.
  - `envio.cota.js`: limite **por Gmail, não por remetente** (dois negócios no mesmo Gmail somam), `GMAIL_LIMITE_DIARIO` (padrão 500), dia em UTC.
  - `envio.fila.js` (sobe com o servidor): um e-mail por Gmail a cada 30–60 s; passou do limite, espera o dia seguinte; senha recusada (`EAUTH`) marca erro em toda a fila do remetente.
  - `envio.template.js`: `{nome}`, `{contato}`, `{cidade}` (escapados) e rodapé no fim. Texto com HTML de bloco (`<p>`, `<br>`, `<div>`...) é usado como está; só texto simples tem as quebras de linha viradas em `<br>`.
  - Rotas: `POST /envios/previa`, `POST /envios` (não reenvia ao mesmo lead pelo mesmo negócio sem `reenviar: true`), `POST /envios/cancelar`.
  - No lead: `envioPendente`, `ultimoEnvioEm`, `ultimoEnvioNegocio`, `envioErro`; lead "novo" vira "contatado" ao receber.
- Excluir conta (super admin) apaga também remetentes e envios.
- `shared`: middlewares (`authenticate`, `authorize`), `idioma.js` + `mensagens.en.js` (mensagem nova da API = tradução nova lá).
- Registrar módulo novo em `index.js` (`fastify.register(xRoutes, { prefix: '/api' })`).

## Frontend (`../marketing-sell-frontend/src/`)
- Base copiada do Sonelia (tema claro/rosa/escuro com marca índigo, `ui.css`, Modal, CampoSenha, Sidebar, PWA).
- `modules/user`, `modules/captacao` (tela de fontes + `FiltrosDaFonte.jsx`), `modules/lead` (lista vira cartões no celular), `pages/Home`.
- `modules/remetente` (tela Remetentes no menu "Conta": cartão "Envios de hoje" com barra por Gmail e cancelar fila) e `modules/envio` (`EnviarEmailModal`, aberto pelo botão "Enviar e-mail" na barra de selecionados em Leads).
- `.card` do `ui.css` não tem padding: cada tela define o seu. Textarea usa `className="input textarea"`.
- Textos: `tr('texto em português')`; inglês em `src/i18n/en.js`.
- `.npmrc` com `legacy-peer-deps` (o npm 10 falha nas dependências opcionais do Vite sem isso).
- Checagem rápida: `npx eslint src` e `npx vite build`.
