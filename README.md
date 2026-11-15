# Marketing Sell — Backend (API)

REST API for **Marketing Sell**, a multi-tenant lead generation and sales routine system. It finds new leads in public data sources (US and Brazil), finds their email addresses, sends emails and automatic follow-ups through Gmail, and turns a daily marketing and sales routine (originally a spreadsheet) into an app.

![Node](https://img.shields.io/badge/node-26.13.1-339933?logo=node.js&logoColor=white)
![Fastify](https://img.shields.io/badge/fastify-5-000000?logo=fastify)
![MongoDB](https://img.shields.io/badge/mongodb-mongoose-47A248?logo=mongodb&logoColor=white)
![License](https://img.shields.io/badge/license-private-lightgrey)

## Demo

- **API (production):** https://api-marketingsell.sonelia.com.br/api (health check at `/api/saude`)
- **Web app:** frontend in [`marketing-sell-frontend`](../marketing-sell-frontend)

## Features

- **Accounts and businesses:** one account can manage several businesses; each business has its own leads, routine, partners and senders.
- **Lead search** in several sources, all returning leads in the same format:
  - `npi`: NPI Registry (US health professionals)
  - `google`: Google Places API (Text Search), with a monthly quota per account
  - `empresas_novas`: newly registered companies from US state open data (Socrata)
  - `licencas`: Texas TDLR licenses
  - `cnpj`: newly opened companies in Brazil, by activity (CNAE), imported monthly from the Federal Revenue open data
- **No duplicates:** a lead is unique per business, source and external ID.
- **Email finder:** a queue that visits each lead's website looking for an email address (blocks internal IPs).
- **Senders:** one per business, with a Gmail address and an encrypted app password, default subject, body and CAN-SPAM footer.
- **Email sending** through Gmail SMTP, with a queue (one email every 30–60 s per Gmail), a daily limit per Gmail and automatic pause when Gmail refuses.
- **Follow-up:** contact tracking, follow-ups after 3, 7 and 14 days, automatic follow-up emails, reply detection over IMAP and a daily Telegram reminder.
- **Sales pipeline:** new → contacted → replied → interested → demo → free trial → customer (or discarded).
- **Daily routine:** weekly grid with tasks per business, routine templates, dashboard (today, week, funnel, consistency).
- **Spreadsheet tabs:** partners, communities and events, preparation and ads checklists, video and article ideas.
- **CSV export** and bulk actions on leads.
- **Super admin panel:** accounts, Google quota, delete account.
- **Three languages:** Portuguese, English and Spanish.

## Tech stack

| Area | Technology |
|---|---|
| Runtime | Node.js 26 (ES modules) |
| Framework | Fastify 5 + `@fastify/cors` |
| Database | MongoDB Atlas + Mongoose |
| Auth | argon2, jsonwebtoken |
| Email | nodemailer (Gmail SMTP), imapflow (replies) |
| Alerts | Telegram Bot API |
| Data sources | NPI Registry, Google Places API, Socrata, Texas open data, Brazil's CNPJ open data |

## Prerequisites

- **Node.js 26.13.1** (see `.nvmrc`; with nvm, run `nvm use`)
- **npm**
- Access to a **MongoDB Atlas** cluster
- Optional: Google Places API key, Socrata app token, Telegram bot, a Gmail account with an app password

## Installation

```bash
git clone <repository-url> marketing-sell-backend
cd marketing-sell-backend
nvm use
npm install
cp .env.example .env   # fill in the values
npm run dev
```

The API runs at `http://localhost:8080/api` (or on the port set in `PORT`).

> ⚠️ **Warning:** the sending, email finder and follow-up queues start with the server. If production is running against the same database, start locally with `SEM_ROTINAS=1` so they don't run twice.

## Configuration (environment variables)

Never commit the `.env` file. Use placeholder values only in documentation.

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | HTTP port |
| `MONGODB_USERNAME` / `MONGODB_PASSWORD` | Yes | MongoDB Atlas credentials |
| `JWT_SECRET` | Yes | Secret used to sign the tokens |
| `EMAIL_CRYPTO_KEY` | Yes | Key that encrypts the senders' Gmail app passwords |
| `GMAIL_LIMITE_DIARIO` | No | Daily emails per Gmail address (default `500`) |
| `GOOGLE_API_KEY` | No | Google Places API key (the only paid source) |
| `GOOGLE_COTA_MENSAL` | No | Default monthly Google quota per account |
| `SOCRATA_APP_TOKEN` | No | Socrata open data app token |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | No | Telegram reminders and alerts |
| `SEM_ROTINAS` | No | `1` starts only the API, without queues and reminders |

## Usage

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the API with nodemon |
| `npm start` | Starts the API with Node (production) |
| `node scripts/rotina-roteiro.mjs --aplicar` | Adds the "script and caption" task to existing routines |

### Response format

Every route lives under `/api` and returns `{ "success": true, "data": {}, "message": "..." }`. Errors return `success: false` with the proper HTTP status. Messages are translated by the `Accept-Language` header.

### Main routes

| Module | Example |
|---|---|
| Health | `GET /api/saude` |
| Businesses | `GET /api/negocios`, `POST /api/negocios/:id/entrar`, `PUT /api/negocios/atual/rotina` |
| Lead search | `GET /api/captacao/opcoes`, `POST /api/captacao/buscas`, `GET /api/captacao/cnaes` |
| Leads | `/api/leads`, `POST /api/leads/:id/contatos` |
| Emails | `POST /api/envios/previa`, `POST /api/envios`, `POST /api/envios/cancelar` |
| Routine | `GET /api/rotina/grade`, `PATCH /api/rotina/:dia`, `GET /api/rotina/painel` |
| Checklists | `GET/POST /api/checklists/:lista` |
| Ideas | `GET /api/ideias?tipo=&de=&ate=` |

### Adding a lead source

Each source is a sub-feature in `src/modules/captacao/fontes/` that exports `{ id, nome, buscar(filtros, contexto) }` and is registered in `fontes/index.js`.

## Folder structure

```
marketing-sell-backend/
├── index.js              # Fastify setup, module registration, queues and jobs
├── scripts/              # One-off scripts
└── src/
    ├── db/               # MongoDB connection
    ├── errors/           # AppError(message, status)
    └── modules/
        ├── <entity>/     # model, dto, service, controller, routes
        │                 # user, negocio, captacao, lead, email-site, remetente, envio,
        │                 # follow-up, rotina, parceiro, comunidade, checklist, ideia
        └── shared/       # middlewares and utils (language, translations, Telegram, dates)
```

## Deployment

- Runs in a **Docker** container on an **OVH VPS**, behind **Caddy** (HTTPS).
- The server has its own `.env`. The queues run there, so don't leave a local backend running against the same database.
- After pushing to `main`, update the server:

```bash
~/atualizar.sh marketingsell
```

## Contributing

1. Create a branch from `main`: `feature/<name>` (or `fix/<name>`).
2. Follow the module pattern and keep business rules in the service.
3. Every query must filter by `tenantId` (the open business). A new collection with `tenantId` must be added to `negocio/negocio.dados.js`, so it is deleted with the business.
4. Every new API message needs its English and Spanish translations in `mensagens.en.js` and `mensagens.es.js`.
5. Write commit messages in Portuguese and open a pull request to `main`.

## License and author

**Private and proprietary.** All rights reserved. Copying, distribution or use without authorization is not allowed.

Developed by **Stanley Andrade**.
