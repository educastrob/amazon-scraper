# 🛒 Amazon Product Scraper

Um script simples para extrair listagens de produtos da Amazon da primeira página de resultados de busca para uma determinada palavra-chave.

## 📋 Requisitos

- [Bun](https://bun.sh/) (versão 1.0 ou superior)
- [Node.js](https://nodejs.org/) (versão 18 ou superior)

## 🚀 Instalação e Execução

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd amazon-scraper
```

### 2. Configure o Backend

```bash
# Entre na pasta do backend
cd backend

# Instale as dependências
bun install

# Inicie o servidor
bun run dev
```

O backend estará rodando em `http://localhost:3000`

### 3. Configure o Frontend

```bash
# Em um novo terminal, entre na pasta do frontend
cd frontend

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

O frontend estará rodando em `http://localhost:5173`

## 🎯 Como Usar

1. **Acesse** `http://localhost:5173` no seu navegador
2. **Digite** uma palavra-chave no campo de busca (ex: "laptop", "phone", "book")
3. **Clique** em "🔍 Buscar Produtos"
4. **Aguarde** o carregamento dos resultados
5. **Visualize** os produtos encontrados com:
   - Título do produto
   - Avaliação (estrelas)
   - Número de avaliações
   - Imagem do produto
   - Link para a Amazon

## 📁 Estrutura do Projeto

```
amazon-scraper/
├── backend/
│   ├── src/
│   │   └── index.ts          # Servidor Express com endpoint de scraping
│   ├── types.d.ts            # Declarações de tipos
│   └── package.json          # Dependências do backend
├── frontend/
│   ├── index.html            # Página principal
│   ├── style.css             # Estilos CSS
│   ├── script.js             # JavaScript do frontend
│   ├── vite.config.js        # Configuração do Vite
│   └── package.json          # Dependências do frontend
└── README.md                 # Este arquivo
```

## 🔧 Tecnologias Utilizadas

### Backend
- **Bun** - Runtime JavaScript
- **Express** - Framework web
- **Axios** - Cliente HTTP
- **JSDOM** - Parser HTML
- **CORS** - Middleware para CORS

### Frontend
- **Vite** - Build tool e dev server
- **HTML5** - Estrutura da página
- **CSS3** - Estilização
- **JavaScript ES6+** - Funcionalidades

## 📊 Funcionalidades

### ✅ Implementadas
- [x] Extração de produtos da Amazon
- [x] Interface web responsiva
- [x] Tratamento de erros
- [x] Loading states
- [x] Exibição de avaliações com estrelas
- [x] Formatação de números de avaliações
- [x] Links diretos para produtos
- [x] Imagens com fallback
- [x] Proxy configurado no Vite

### 🎨 Interface
- Design moderno e responsivo
- Gradientes e animações
- Cards de produtos com hover effects
- Loading spinner animado
- Mensagens de erro elegantes

## 🔍 Endpoints da API

### GET `/api/scrape`
Extrai produtos da Amazon baseado em uma palavra-chave.

**Parâmetros:**
- `keyword` (string, obrigatório) - Palavra-chave para busca

**Exemplo:**
```bash
curl "http://localhost:3000/api/scrape?keyword=laptop"
```

**Resposta:**
```json
[
  {
    "title": "Laptop Dell Inspiron 15 3000",
    "rating": 4.5,
    "reviews": 1234,
    "imageUrl": "https://example.com/image.jpg",
    "url": "https://www.amazon.com/product-url"
  }
]
```

## 🛠️ Desenvolvimento

### Backend
```bash
cd backend
bun run dev  # Modo desenvolvimento com hot reload
```

### Frontend
```bash
cd frontend
npm run dev  # Servidor de desenvolvimento Vite
```

## 🐛 Solução de Problemas

### Erro de CORS
Se você encontrar erros de CORS, verifique se:
1. O backend está rodando na porta 3000
2. O frontend está usando o proxy configurado no Vite

### Nenhum produto encontrado
Isso pode acontecer se:
1. A Amazon bloqueou a requisição
2. A estrutura da página mudou
3. A palavra-chave não retornou resultados

### Erro de conexão
Verifique se:
1. Ambos os servidores estão rodando
2. As portas 3000 e 5173 estão disponíveis
3. Não há firewall bloqueando as conexões

## 📝 Comentários do Código

O código está bem documentado com comentários explicando:
- Lógica de scraping
- Tratamento de erros
- Funcionalidades do frontend
- Configurações de proxy

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é um teste técnico e está sob a licença MIT.

## 👨‍💻 Autor

Desenvolvido como teste técnico para demonstração de habilidades em:
- Scraping web
- APIs REST
- Frontend moderno
- JavaScript/TypeScript
- Ferramentas de build 