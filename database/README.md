# 🗄️ Base de Conhecimento SQLite

## Estrutura do Banco de Dados

### Tabela: `pull_requests`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | INTEGER | ID autoincremental (chave primária) |
| pr_number | INTEGER | Número do PR (único) |
| title | TEXT | Título do PR |
| description | TEXT | Descrição completa |
| author | TEXT | Username do autor |
| status | TEXT | Status: open, merged, closed |
| url | TEXT | URL do PR no GitHub |
| created_at | TEXT | Data de criação (ISO 8601) |
| merged_at | TEXT | Data do merge (se aplicável) |
| closed_at | TEXT | Data de fechamento (se aplicável) |
| labels | TEXT | Labels separadas por vírgula |
| branch_from | TEXT | Branch de origem |
| branch_to | TEXT | Branch de destino |
| commits | INTEGER | Número de commits |
| changed_files | INTEGER | Número de arquivos alterados |
| synced_to_notion | INTEGER | 1 se sincronizado, 0 caso contrário |
| notion_page_id | TEXT | ID da página no Notion |
| last_updated | TEXT | Última atualização (timestamp) |

### Tabela: `issues`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | INTEGER | ID autoincremental (chave primária) |
| issue_number | INTEGER | Número da issue (único) |
| title | TEXT | Título da issue |
| description | TEXT | Descrição completa |
| author | TEXT | Username do autor |
| status | TEXT | Status: open, closed |
| url | TEXT | URL da issue no GitHub |
| created_at | TEXT | Data de criação (ISO 8601) |
| closed_at | TEXT | Data de fechamento (se aplicável) |
| labels | TEXT | Labels separadas por vírgula |
| assignees | TEXT | Responsáveis separados por vírgula |
| comments_count | INTEGER | Número de comentários |
| milestone | TEXT | Milestone associada |
| synced_to_notion | INTEGER | 1 se sincronizado, 0 caso contrário |
| notion_page_id | TEXT | ID da página no Notion |
| last_updated | TEXT | Última atualização (timestamp) |

## Comandos Úteis

### Visualizar conteúdo do banco
```bash
npm run view-db
```

### Testar banco de dados
```bash
npm run test-db
```

### Acessar SQLite diretamente
```bash
sqlite3 knowledge-base.db

# Comandos úteis no SQLite:
.tables                    # Lista todas as tabelas
.schema pull_requests      # Mostra estrutura da tabela
SELECT * FROM pull_requests LIMIT 5;  # Consulta
.quit                      # Sair
```

## Consultas SQL Úteis

### PRs mais recentes
```sql
SELECT pr_number, title, status, created_at 
FROM pull_requests 
ORDER BY created_at DESC 
LIMIT 10;
```

### Issues abertas
```sql
SELECT issue_number, title, author, created_at 
FROM issues 
WHERE status = 'open' 
ORDER BY created_at DESC;
```

### Estatísticas por autor
```sql
SELECT author, COUNT(*) as total_prs 
FROM pull_requests 
GROUP BY author 
ORDER BY total_prs DESC;
```

### PRs merged por mês
```sql
SELECT 
  strftime('%Y-%m', merged_at) as mes,
  COUNT(*) as total
FROM pull_requests 
WHERE status = 'merged'
GROUP BY mes
ORDER BY mes DESC;
```

### Issues com mais comentários
```sql
SELECT issue_number, title, comments_count 
FROM issues 
ORDER BY comments_count DESC 
LIMIT 10;
```

## Backup e Restauração

### Fazer backup
```bash
cp knowledge-base.db knowledge-base-backup-$(date +%Y%m%d).db
```

### Exportar para SQL
```bash
sqlite3 knowledge-base.db .dump > backup.sql
```

### Restaurar de SQL
```bash
sqlite3 knowledge-base-new.db < backup.sql
```

## Localização

O arquivo do banco de dados é criado automaticamente em:
```
/home/usuario/Documentos/qa/integ-notion-github-actions/knowledge-base.db
```
