const Database = require('../database/sqlite');

async function testDatabase() {
  const db = new Database();

  console.log('\n🧪 === TESTE DO BANCO DE DADOS ===\n');

  try {
    // Teste 1: Inserir PR de exemplo
    console.log('📝 Teste 1: Inserindo Pull Request de exemplo...');
    const prData = {
      number: 999,
      title: 'Teste: Adicionar funcionalidade X',
      body: 'Este é um PR de teste para validar a integração',
      user: { login: 'test-user' },
      state: 'open',
      merged: false,
      html_url: 'https://github.com/test/repo/pull/999',
      created_at: new Date().toISOString(),
      merged_at: null,
      closed_at: null,
      labels: [{ name: 'feature' }, { name: 'test' }],
      head: { ref: 'feature/test' },
      base: { ref: 'main' },
      commits: 3,
      changed_files: 5
    };

    await db.savePR(prData, 'notion-test-page-id-123');
    console.log('✓ PR #999 inserido com sucesso\n');

    // Teste 2: Inserir Issue de exemplo
    console.log('📝 Teste 2: Inserindo Issue de exemplo...');
    const issueData = {
      number: 888,
      title: 'Teste: Bug na funcionalidade Y',
      body: 'Esta é uma issue de teste para validar a integração',
      user: { login: 'test-user' },
      state: 'open',
      html_url: 'https://github.com/test/repo/issues/888',
      created_at: new Date().toISOString(),
      closed_at: null,
      labels: [{ name: 'bug' }, { name: 'high-priority' }],
      assignees: [{ login: 'developer1' }, { login: 'developer2' }],
      comments: 5,
      milestone: { title: 'v1.0.0' }
    };

    await db.saveIssue(issueData, 'notion-test-issue-id-456');
    console.log('✓ Issue #888 inserida com sucesso\n');

    // Teste 3: Consultar estatísticas
    console.log('📊 Teste 3: Consultando estatísticas...');
    const stats = await db.getStats();
    console.log(`PRs no banco: ${stats.prs.total} (${stats.prs.synced} sincronizados)`);
    console.log(`Issues no banco: ${stats.issues.total} (${stats.issues.synced} sincronizados)\n`);

    // Teste 4: Listar PRs
    console.log('📋 Teste 4: Listando todos os PRs...');
    const prs = await db.getAllPRs();
    console.log(`Total de PRs encontrados: ${prs.length}`);
    if (prs.length > 0) {
      console.log('Últimos 3 PRs:');
      prs.slice(0, 3).forEach(pr => {
        console.log(`  #${pr.pr_number} - ${pr.title} (${pr.status})`);
      });
    }
    console.log('');

    // Teste 5: Listar Issues
    console.log('📋 Teste 5: Listando todas as Issues...');
    const issues = await db.getAllIssues();
    console.log(`Total de Issues encontradas: ${issues.length}`);
    if (issues.length > 0) {
      console.log('Últimas 3 Issues:');
      issues.slice(0, 3).forEach(issue => {
        console.log(`  #${issue.issue_number} - ${issue.title} (${issue.status})`);
      });
    }
    console.log('');

    console.log('✅ Todos os testes passaram com sucesso!');
    console.log('\n💡 Dica: Execute "npm run view-db" para ver o conteúdo completo do banco.');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
  } finally {
    await db.close();
  }
}

// Executa se for chamado diretamente
if (require.main === module) {
  testDatabase();
}

module.exports = { testDatabase };
