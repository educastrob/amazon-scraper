# Amazon Product Scraper

Sistema de web scraping para extrair produtos da Amazon usando Bun (backend) e Vite (frontend).

## Pré-requisitos

- **Bun** (versão 1.0+)
- **Node.js** (versão 18+)

## Instalação

```bash
git clone https://github.com/educastrob/amazon-scraper.git
cd amazon-scraper

bun install
cd backend && bun install && cd ..
cd frontend && bun install && cd ..
```

## Execução

```bash
bun run dev
```

Acesse `http://localhost:5173` no navegador.

## Estrutura

```
amazon-scraper/
├── backend/           # Servidor Bun + Express
├── frontend/          # Interface Vite + Vanilla JS
└── package.json       # Scripts principais
```

## API Endpoints

- `GET /api/scrape?keyword=termo` - Extrai produtos da Amazon
- `GET /api/health` - Status do servidor

## Tecnologias

- **Backend**: Bun, Express, Axios, JSDOM
- **Frontend**: Vite, Vanilla JavaScript, CSS3
- **Testes**: Bun test, Vitest

## Scripts

- `bun run dev` - Desenvolvimento (backend + frontend)
- `bun run build` - Build do frontend
- `bun run test` - Executa testes
- `bun run start` - Produção

## Aviso Legal

Este projeto é apenas para fins educacionais. O web scraping pode violar os Termos de Serviço da Amazon. Use com responsabilidade.
