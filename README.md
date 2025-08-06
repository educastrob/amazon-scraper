# Amazon Product Scraper

Sistema de web scraping para extrair produtos da Amazon usando Bun (backend) e Vite (frontend).

## Funcionalidades

- **Scraping Inteligente**: Extração robusta de dados com múltiplos seletores
- **Preços Formatados**: Exibição em Real brasileiro com preços originais
- **Links Diretos**: Acesso direto aos produtos na Amazon
- **Tratamento de Erros**: Mensagens claras quando dados não são encontrados
- **Interface Responsiva**: Design moderno e adaptável
- **Rate Limiting**: Proteção contra bloqueios
- **Retry Automático**: Tentativas inteligentes com backoff

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

## Estrutura do Projeto

```
amazon-scraper/
├── backend/                 # Servidor Bun + Express
│   ├── index.js            # API principal
│   ├── scraping-strategies.js  # Estratégias de scraping
│   └── package.json        # Dependências do backend
├── frontend/               # Interface Vite + Vanilla JS
│   ├── index.html          # Página principal
│   ├── main.js            # Lógica da aplicação
│   ├── style.css          # Estilos CSS
│   ├── vite.config.js     # Configuração do Vite
│   └── package.json       # Dependências do frontend
├── package.json           # Scripts principais
└── README.md             # Documentação
```

## API Endpoints

- `GET /api/scrape?keyword=termo` - Extrai produtos da Amazon
- `GET /api/health` - Status do servidor

### Exemplo de Resposta

```json
{
  "success": true,
  "keyword": "laptop",
  "totalProducts": 24,
  "products": [
    {
      "id": 1,
      "title": "Dell XPS 13 Laptop",
      "rating": 4.5,
      "reviewCount": 1234,
      "imageUrl": "https://example.com/image.jpg",
      "price": "R$ 4.999,00",
      "originalPrice": "R$ 5.999,00",
      "availability": "Em estoque",
      "productUrl": "https://amazon.com/product",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "errors": {
        "title": null,
        "rating": null,
        "reviewCount": null,
        "imageUrl": null,
        "price": null,
        "productUrl": null
      }
    }
  ]
}
```

## Tecnologias

- **Backend**: Bun, Express, Axios, JSDOM
- **Frontend**: Vite, Vanilla JavaScript, CSS3
- **Scraping**: Múltiplos seletores CSS, User Agent rotation
- **Formatação**: Intl.NumberFormat para preços em Real

## Scripts Disponíveis

- `bun run dev` - Desenvolvimento (backend + frontend)
- `bun run backend:dev` - Apenas backend
- `bun run frontend:dev` - Apenas frontend
- `bun run build` - Build do frontend
- `bun run start` - Produção

## Características do Scraping

- **Rotação de User Agents**: Headers realistas
- **Delays Aleatórios**: Pausas entre requisições
- **Retry com Backoff**: Tentativas inteligentes
- **Parsing Robusto**: Múltiplos seletores CSS
- **Validação de Dados**: Verificação de integridade
- **Formatação de Preços**: Conversão para Real brasileiro
- **Extração de Links**: URLs diretas para produtos

## Tratamento de Erros

O sistema identifica e reporta quando dados não podem ser extraídos:

- **Preços**: "Preço não disponível"
- **Avaliações**: "Avaliação não disponível"
- **Imagens**: "Imagem não disponível"
- **Links**: "Link do produto não encontrado"

## Aviso Legal

Este projeto é apenas para fins educacionais. O web scraping pode violar os Termos de Serviço da Amazon. Use com responsabilidade e respeite os limites de rate limiting.
