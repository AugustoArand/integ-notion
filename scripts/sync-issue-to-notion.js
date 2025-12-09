const { Client } = require('@notionhq/client');
const core = require('@actions/core');
const Database = require('../database/sqlite');

// Inicializa o cliente do Notion
const notion = new Client({ auth: process.env.NOTION_TOKEN });
const db = new Database();

/**
 * Sincroniza uma Issue do GitHub com o Notion
 * @param {Object} issueData - Dados da issue vindo do GitHub
 */
async function syncIssueToNotion(issueData) {
  const databaseId = process.env.NOTION_DATABASE_ID_ISSUES;

  try {
    // Busca se já existe uma página para esta issue
    const existingPages = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: 'Issue Number',
        number: {
          equals: issueData.number
        }
      }
    });

    const properties = {
      'Title': {
        title: [
          {
            text: {
              content: issueData.title
            }
          }
        ]
      },
      'Issue Number': {
        number: issueData.number
      },
      'Status': {
        select: {
          name: issueData.state === 'closed' ? 'Closed' : 'Open'
        }
      },
      'Author': {
        rich_text: [
          {
            text: {
              content: issueData.user.login
            }
          }
        ]
      },
      'URL': {
        url: issueData.html_url
      },
      'Created At': {
        date: {
          start: issueData.created_at
        }
      }
    };

    // Adiciona data de fechamento se disponível
    if (issueData.closed_at) {
      properties['Closed At'] = {
        date: {
          start: issueData.closed_at
        }
      };
    }

    // Adiciona labels se existirem
    if (issueData.labels && issueData.labels.length > 0) {
      properties['Labels'] = {
        multi_select: issueData.labels.map(label => ({ name: label.name }))
      };
    }

    // Adiciona assignees se existirem
    if (issueData.assignees && issueData.assignees.length > 0) {
      properties['Assignees'] = {
        rich_text: [
          {
            text: {
              content: issueData.assignees.map(a => a.login).join(', ')
            }
          }
        ]
      };
    }

    // Cria o conteúdo da página com detalhes da issue
    const children = [
      {
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: 'Descrição' } }]
        }
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: { content: issueData.body || 'Sem descrição fornecida.' }
            }
          ]
        }
      },
      {
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: 'Informações' } }]
        }
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            {
              type: 'text',
              text: { content: `Estado: ${issueData.state}` }
            }
          ]
        }
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            {
              type: 'text',
              text: { content: `Comentários: ${issueData.comments || 0}` }
            }
          ]
        }
      }
    ];

    // Adiciona milestone se existir
    if (issueData.milestone) {
      children.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            {
              type: 'text',
              text: { content: `Milestone: ${issueData.milestone.title}` }
            }
          ]
        }
      });
    }

    let notionPageId = null;

    if (existingPages.results.length > 0) {
      // Atualiza página existente
      const pageId = existingPages.results[0].id;
      await notion.pages.update({
        page_id: pageId,
        properties: properties
      });
      notionPageId = pageId;
      console.log(`✓ Issue #${issueData.number} atualizada no Notion`);
      core.info(`Issue #${issueData.number} atualizada no Notion`);
    } else {
      // Cria nova página
      const page = await notion.pages.create({
        parent: { database_id: databaseId },
        properties: properties,
        children: children
      });
      notionPageId = page.id;
      console.log(`✓ Issue #${issueData.number} criada no Notion`);
      core.info(`Issue #${issueData.number} criada no Notion`);
    }

    // Salva no banco de dados local
    await db.saveIssue(issueData, notionPageId);
    console.log(`✓ Issue #${issueData.number} salva no banco de dados local`);

  } catch (error) {
    console.error('Erro ao sincronizar issue com Notion:', error);
    core.setFailed(`Erro ao sincronizar issue: ${error.message}`);
    
    // Mesmo com erro no Notion, tenta salvar localmente
    try {
      await db.saveIssue(issueData, null);
      console.log(`✓ Issue #${issueData.number} salva localmente (Notion falhou)`);
    } catch (dbError) {
      console.error('Erro ao salvar no banco local:', dbError);
    }
    
    throw error;
  } finally {
    await db.close();
  }
}

// Executa se for chamado diretamente
if (require.main === module) {
  // Lê dados da issue do ambiente (fornecido pelo GitHub Actions)
  const issueData = JSON.parse(process.env.ISSUE_DATA || '{}');
  
  if (!issueData.number) {
    console.error('Erro: ISSUE_DATA não fornecido ou inválido');
    process.exit(1);
  }

  syncIssueToNotion(issueData)
    .then(() => {
      console.log('Sincronização concluída com sucesso!');
    })
    .catch((error) => {
      console.error('Falha na sincronização:', error);
      process.exit(1);
    });
}

module.exports = { syncIssueToNotion };
