# 🔗 Integração Notion + GitHub Actions

Sistema de gestão de conhecimento que sincroniza automaticamente Pull Requests e Issues do GitHub com databases no Notion.

## 📋 Funcionalidades

- ✅ **Sincronização de Pull Requests**: Cria/atualiza páginas no Notion quando PRs são abertos, editados, fechados ou merged
- ✅ **Sincronização de Issues**: Documenta issues importantes automaticamente no Notion
- ✅ **Base de conhecimento**: Mantém histórico organizado de todas as alterações do repositório
- ✅ **Atualização automática**: Sincroniza status, labels, assignees e outras informações em tempo real
- ✅ **Banco de dados local SQLite**: Armazena todos os dados localmente para consultas rápidas e backup
- ✅ **Resiliência**: Salva localmente mesmo se o Notion estiver indisponível

## 🚀 Configuração

### 1. Criar Integration no Notion

1. Acesse [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Clique em **"+ New integration"**
3. Dê um nome (ex: "GitHub Integration")
4. Copie o **Internal Integration Token** (começa com `secret_`)

### 2. Criar Databases no Notion

#### Database para Pull Requests

Crie um database com as seguintes propriedades:

| Nome da Propriedade | Tipo |
|---------------------|------|
| Title | Title |
| PR Number | Number |
| Status | Select (Open, Merged, Closed) |
| Author | Text |
| URL | URL |
| Created At | Date |
| Merged At | Date |
| Labels | Multi-select |

#### Database para Issues

Crie um database com as seguintes propriedades:

| Nome da Propriedade | Tipo |
|---------------------|------|
| Title | Title |
| Issue Number | Number |
| Status | Select (Open, Closed) |
| Author | Text |
| URL | URL |
| Created At | Date |
| Closed At | Date |
| Labels | Multi-select |
| Assignees | Text |

### 3. Compartilhar Databases com a Integration

1. Abra cada database no Notion
2. Clique nos três pontos (**...**) no canto superior direito
3. Clique em **"Connections"** → **"Connect to"**
4. Selecione sua integration criada anteriormente

### 4. Obter IDs dos Databases

Copie os IDs dos databases da URL:
```
https://www.notion.so/workspace/DATABASE_ID?v=...
                                ^^^^^^^^^^^^
```

### 5. Configurar Secrets no GitHub

No seu repositório GitHub:

1. Vá em **Settings** → **Secrets and variables** → **Actions**
2. Clique em **"New repository secret"**
3. Adicione os seguintes secrets:

| Nome | Valor |
|------|-------|
| `NOTION_TOKEN` | Seu token de integração do Notion |
| `NOTION_DATABASE_ID_PRS` | ID do database de Pull Requests |
| `NOTION_DATABASE_ID_ISSUES` | ID do database de Issues |

## 📦 Instalação

```bash
# Instalar dependências
npm install
```

## 🗄️ Banco de Dados SQLite

O projeto usa **SQLite** como banco de dados local para armazenar todos os PRs e Issues sincronizados. Vantagens:

- 📁 Arquivo único `knowledge-base.db`
- 🚀 Rápido e leve (sem servidor necessário)
- 💾 Backup simples (copiar arquivo)
- 🔍 Consultas SQL diretas
- 🛡️ Funciona mesmo se o Notion estiver offline

### Comandos do Banco de Dados

```bash
# Ver estatísticas e conteúdo completo
npm run view-db

# Testar banco com dados de exemplo
npm run test-db

# Acessar diretamente com SQLite
sqlite3 knowledge-base.db
```

Veja mais detalhes em [`database/README.md`](database/README.md)

## 🔧 Uso Local (Desenvolvimento)

Crie um arquivo `.env` baseado no `.env.example`:

```bash
cp .env.example .env
```

Edite o `.env` com suas credenciais:

```env
NOTION_TOKEN=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_DATABASE_ID_PRS=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_DATABASE_ID_ISSUES=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Testar sincronização de PR:

```bash
# Defina os dados de teste
export PR_DATA='{"number":1,"title":"Test PR","state":"open","user":{"login":"username"},"html_url":"https://github.com/user/repo/pull/1","created_at":"2025-12-08T00:00:00Z","body":"Test description","head":{"ref":"feature"},"base":{"ref":"main"}}'

# Execute o script
npm run sync-pr
```

### Testar sincronização de Issue:

```bash
# Defina os dados de teste
export ISSUE_DATA='{"number":1,"title":"Test Issue","state":"open","user":{"login":"username"},"html_url":"https://github.com/user/repo/issues/1","created_at":"2025-12-08T00:00:00Z","body":"Test description"}'

# Execute o script
npm run sync-issue
```

## 🤖 Automação com GitHub Actions

Os workflows já estão configurados em `.github/workflows/`:

- **sync-pr.yml**: Executa quando PRs são abertos, editados, fechados ou reabertos
- **sync-issue.yml**: Executa quando issues são abertas, editadas, fechadas, labeled, etc.

Após configurar os secrets, as sincronizações acontecerão automaticamente! 🎉

## 📊 Estrutura do Projeto

```
.
├── .github/
│   └── workflows/
│       ├── sync-pr.yml          # Workflow para PRs
│       └── sync-issue.yml       # Workflow para Issues
├── database/
│   ├── sqlite.js                # Classe para gerenciar SQLite
│   └── README.md                # Documentação do banco
├── scripts/
│   ├── sync-pr-to-notion.js     # Script de sincronização de PRs
│   ├── sync-issue-to-notion.js  # Script de sincronização de Issues
│   ├── view-database.js         # Visualizar conteúdo do banco
│   └── test-database.js         # Testar banco com dados de exemplo
├── .env.example                 # Exemplo de variáveis de ambiente
├── .gitignore
├── knowledge-base.db            # Banco SQLite (gerado automaticamente)
├── package.json
└── README.md
```

## 🔍 Como Funciona

1. **Evento no GitHub**: Um PR é aberto ou uma issue é criada
2. **GitHub Actions**: O workflow correspondente é acionado automaticamente
3. **Script Node.js**: Processa os dados do evento e se comunica com a API do Notion
4. **Notion**: Cria ou atualiza a página no database correspondente
5. **SQLite**: Salva os dados localmente no banco de dados para consulta rápida

### Fluxo de Sincronização

```
GitHub Event → GitHub Actions → Node.js Script
                                      ↓
                              ┌───────┴────────┐
                              ↓                ↓
                         Notion API      SQLite DB
                              ↓                ↓
                      (Base externa)  (Base local)
```

**Resiliência**: Se o Notion estiver offline, os dados ainda são salvos localmente!

## 🛠️ Personalização

Você pode personalizar os scripts em `scripts/` para:

- Adicionar mais propriedades aos databases
- Modificar o formato das páginas criadas
- Adicionar filtros (ex: apenas PRs com label específica)
- Integrar com outros serviços

## 📝 Licença

MIT

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.
# integ-notion
