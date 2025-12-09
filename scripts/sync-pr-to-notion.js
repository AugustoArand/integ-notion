const { Client } = require('@notionhq/client');
const core = require('@actions/core');
const Database = require('../database/sqlite');

// Inicializa o cliente do Notion
const notion = new Client({ auth: process.env.NOTION_TOKEN });
const db = new Database();

/**
 * Sincroniza um Pull Request do GitHub com o Notion
 * @param {Object} prData - Dados do PR vindo do GitHub
 */
async function syncPRToNotion(prData) {
  const databaseId = process.env.NOTION_DATABASE_ID_PRS;

  try {
    // Busca se já existe uma página para este PR
    const existingPages = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: 'PR Number',
        number: {
          equals: prData.number
        }
      }
    });

    const properties = {
      'Title': {
        title: [
          {
            text: {
              content: prData.title
            }
          }
        ]
      },
      'PR Number': {
        number: prData.number
      },
      'Status': {
        select: {
          name: prData.state === 'closed' 
            ? (prData.merged ? 'Merged' : 'Closed') 
            : 'Open'
        }
      },
      'Author': {
        rich_text: [
          {
            text: {
              content: prData.user.login
            }
          }
        ]
      },
      'URL': {
        url: prData.html_url
      },
      'Created At': {
        date: {
          start: prData.created_at
        }
      }
    };

    // Adiciona data de merge se disponível
    if (prData.merged_at) {
      properties['Merged At'] = {
        date: {
          start: prData.merged_at
        }
      };
    }

    // Adiciona labels se existirem
    if (prData.labels && prData.labels.length > 0) {
      properties['Labels'] = {
        multi_select: prData.labels.map(label => ({ name: label.name }))
      };
    }

    // Cria o conteúdo da página com detalhes do PR
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
              text: { content: prData.body || 'Sem descrição fornecida.' }
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
              text: { content: `Branch: ${prData.head.ref} → ${prData.base.ref}` }
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
              text: { content: `Commits: ${prData.commits || 0}` }
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
              text: { content: `Arquivos alterados: ${prData.changed_files || 0}` }
            }
          ]
        }
      }
    ];

    let notionPageId = null;

    if (existingPages.results.length > 0) {
      // Atualiza página existente
      const pageId = existingPages.results[0].id;
      await notion.pages.update({
        page_id: pageId,
        properties: properties
      });
      notionPageId = pageId;
      console.log(`✓ PR #${prData.number} atualizado no Notion`);
      core.info(`PR #${prData.number} atualizado no Notion`);
    } else {
      // Cria nova página
      const page = await notion.pages.create({
        parent: { database_id: databaseId },
        properties: properties,
        children: children
      });
      notionPageId = page.id;
      console.log(`✓ PR #${prData.number} criado no Notion`);
      core.info(`PR #${prData.number} criado no Notion`);
    }

    // Salva no banco de dados local
    await db.savePR(prData, notionPageId);
    console.log(`✓ PR #${prData.number} salvo no banco de dados local`);

  } catch (error) {
    console.error('Erro ao sincronizar PR com Notion:', error);
    core.setFailed(`Erro ao sincronizar PR: ${error.message}`);
    
    // Mesmo com erro no Notion, tenta salvar localmente
    try {
      await db.savePR(prData, null);
      console.log(`✓ PR #${prData.number} salvo localmente (Notion falhou)`);
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
  // Lê dados do PR do ambiente (fornecido pelo GitHub Actions)
  const prData = JSON.parse(process.env.PR_DATA || '{}');
  
  if (!prData.number) {
    console.error('Erro: PR_DATA não fornecido ou inválido');
    process.exit(1);
  }

  syncPRToNotion(prData)
    .then(() => {
      console.log('Sincronização concluída com sucesso!');
    })
    .catch((error) => {
      console.error('Falha na sincronização:', error);
      process.exit(1);
    });
}

module.exports = { syncPRToNotion };
