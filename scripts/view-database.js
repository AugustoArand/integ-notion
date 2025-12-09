const Database = require('../database/sqlite');

async function viewDatabase() {
  const db = new Database();

  try {
    console.log('\n📊 === ESTATÍSTICAS DA BASE DE CONHECIMENTO ===\n');
    
    const stats = await db.getStats();
    console.log(`Pull Requests: ${stats.prs.total} total | ${stats.prs.synced} sincronizados com Notion`);
    console.log(`Issues: ${stats.issues.total} total | ${stats.issues.synced} sincronizados com Notion`);

    console.log('\n📝 === PULL REQUESTS ===\n');
    const prs = await db.getAllPRs();
    if (prs.length === 0) {
      console.log('Nenhum PR registrado ainda.');
    } else {
      prs.forEach(pr => {
        console.log(`#${pr.pr_number} - ${pr.title}`);
        console.log(`  Status: ${pr.status} | Autor: ${pr.author}`);
        console.log(`  Criado: ${new Date(pr.created_at).toLocaleDateString('pt-BR')}`);
        console.log(`  URL: ${pr.url}`);
        if (pr.synced_to_notion) {
          console.log(`  ✓ Sincronizado com Notion (Page ID: ${pr.notion_page_id})`);
        }
        console.log('');
      });
    }

    console.log('\n🐛 === ISSUES ===\n');
    const issues = await db.getAllIssues();
    if (issues.length === 0) {
      console.log('Nenhuma issue registrada ainda.');
    } else {
      issues.forEach(issue => {
        console.log(`#${issue.issue_number} - ${issue.title}`);
        console.log(`  Status: ${issue.status} | Autor: ${issue.author}`);
        console.log(`  Criado: ${new Date(issue.created_at).toLocaleDateString('pt-BR')}`);
        console.log(`  Comentários: ${issue.comments_count}`);
        console.log(`  URL: ${issue.url}`);
        if (issue.synced_to_notion) {
          console.log(`  ✓ Sincronizado com Notion (Page ID: ${issue.notion_page_id})`);
        }
        console.log('');
      });
    }

  } catch (error) {
    console.error('Erro ao consultar banco de dados:', error);
  } finally {
    await db.close();
  }
}

// Executa se for chamado diretamente
if (require.main === module) {
  viewDatabase();
}

module.exports = { viewDatabase };
