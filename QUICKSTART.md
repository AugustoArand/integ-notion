# 🚀 Guia Rápido - Testando a Integração

Este guia mostra como testar a integração localmente antes de configurar com o GitHub Actions.

## Passo 1: Instalar Dependências

```bash
npm install
```

## Passo 2: Testar o Banco de Dados

Execute o teste do banco de dados SQLite:

```bash
npm run test-db
```

Você verá:
- ✓ PR de teste inserido
- ✓ Issue de teste inserida
- 📊 Estatísticas do banco
- 📋 Listagem dos dados

## Passo 3: Visualizar o Banco

```bash
npm run view-db
```

Isso mostrará todo o conteúdo do banco de dados de forma organizada.

## Passo 4: Consultar com SQLite (Opcional)

Se você tem o SQLite instalado:

```bash
sqlite3 knowledge-base.db
```

Dentro do SQLite:
```sql
-- Ver todas as tabelas
.tables

-- Ver estrutura de uma tabela
.schema pull_requests

-- Consultar PRs
SELECT pr_number, title, status FROM pull_requests;

-- Consultar issues
SELECT issue_number, title, status FROM issues;

-- Sair
.quit
```

## Passo 5: Testar Sincronização com Notion (Opcional)

Se você já configurou o Notion:

### Testar PR:

```bash
# Linux/Mac
export NOTION_TOKEN="seu_token_aqui"
export NOTION_DATABASE_ID_PRS="seu_database_id_aqui"
export PR_DATA='{"number":123,"title":"Test PR","state":"open","user":{"login":"testuser"},"html_url":"https://github.com/test/repo/pull/123","created_at":"2025-12-09T00:00:00Z","body":"Test description","head":{"ref":"feature"},"base":{"ref":"main"},"commits":5,"changed_files":10}'

npm run sync-pr
```

### Testar Issue:

```bash
# Linux/Mac
export NOTION_TOKEN="seu_token_aqui"
export NOTION_DATABASE_ID_ISSUES="seu_database_id_aqui"
export ISSUE_DATA='{"number":456,"title":"Test Issue","state":"open","user":{"login":"testuser"},"html_url":"https://github.com/test/repo/issues/456","created_at":"2025-12-09T00:00:00Z","body":"Test issue description","labels":[{"name":"bug"}],"assignees":[{"login":"dev1"}],"comments":3}'

npm run sync-issue
```

## Verificando os Resultados

### No Terminal:
Você verá mensagens como:
```
✓ Conectado ao banco de dados SQLite
✓ Tabelas criadas/verificadas
✓ PR #123 criado no Notion
✓ PR #123 salvo no banco de dados local
```

### No Banco de Dados:
```bash
npm run view-db
```

### No Notion:
Verifique seu database do Notion - uma nova página foi criada!

## Limpando os Dados de Teste

Se quiser começar do zero:

```bash
rm knowledge-base.db
npm run test-db  # Recria o banco
```

## Próximo Passo

Depois de testar localmente, configure o GitHub Actions seguindo o [README.md](../README.md) principal.

## Troubleshooting

### Erro: "Cannot find module 'sqlite3'"
```bash
npm install
```

### Erro: "NOTION_TOKEN not defined"
Certifique-se de exportar as variáveis de ambiente antes de executar os scripts.

### Erro ao conectar no Notion
Verifique:
1. Token está correto
2. Database ID está correto
3. Integration foi conectada ao database no Notion
4. Database tem as propriedades corretas

### Verificar se SQLite funciona
```bash
sqlite3 --version
```

Se não estiver instalado:
- Ubuntu/Debian: `sudo apt-get install sqlite3`
- Mac: `brew install sqlite3`
- Windows: Baixe de https://sqlite.org/download.html
