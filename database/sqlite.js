const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Caminho do banco de dados
const DB_PATH = path.join(__dirname, '..', 'knowledge-base.db');

class Database {
  constructor() {
    this.db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
      } else {
        console.log('✓ Conectado ao banco de dados SQLite');
        this.initTables();
      }
    });
  }

  initTables() {
    // Tabela para Pull Requests
    this.db.run(`
      CREATE TABLE IF NOT EXISTS pull_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pr_number INTEGER UNIQUE NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        author TEXT,
        status TEXT,
        url TEXT,
        created_at TEXT,
        merged_at TEXT,
        closed_at TEXT,
        labels TEXT,
        branch_from TEXT,
        branch_to TEXT,
        commits INTEGER,
        changed_files INTEGER,
        synced_to_notion INTEGER DEFAULT 0,
        notion_page_id TEXT,
        last_updated TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela para Issues
    this.db.run(`
      CREATE TABLE IF NOT EXISTS issues (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        issue_number INTEGER UNIQUE NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        author TEXT,
        status TEXT,
        url TEXT,
        created_at TEXT,
        closed_at TEXT,
        labels TEXT,
        assignees TEXT,
        comments_count INTEGER DEFAULT 0,
        milestone TEXT,
        synced_to_notion INTEGER DEFAULT 0,
        notion_page_id TEXT,
        last_updated TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✓ Tabelas criadas/verificadas');
  }

  // Salvar ou atualizar PR
  savePR(prData, notionPageId = null) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO pull_requests (
          pr_number, title, description, author, status, url,
          created_at, merged_at, closed_at, labels, branch_from, 
          branch_to, commits, changed_files, synced_to_notion, notion_page_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(pr_number) DO UPDATE SET
          title = excluded.title,
          description = excluded.description,
          status = excluded.status,
          merged_at = excluded.merged_at,
          closed_at = excluded.closed_at,
          labels = excluded.labels,
          synced_to_notion = excluded.synced_to_notion,
          notion_page_id = excluded.notion_page_id,
          last_updated = CURRENT_TIMESTAMP
      `;

      const params = [
        prData.number,
        prData.title,
        prData.body || '',
        prData.user.login,
        prData.state === 'closed' ? (prData.merged ? 'merged' : 'closed') : 'open',
        prData.html_url,
        prData.created_at,
        prData.merged_at || null,
        prData.closed_at || null,
        prData.labels ? prData.labels.map(l => l.name).join(',') : '',
        prData.head?.ref || '',
        prData.base?.ref || '',
        prData.commits || 0,
        prData.changed_files || 0,
        notionPageId ? 1 : 0,
        notionPageId
      ];

      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  // Salvar ou atualizar Issue
  saveIssue(issueData, notionPageId = null) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO issues (
          issue_number, title, description, author, status, url,
          created_at, closed_at, labels, assignees, comments_count,
          milestone, synced_to_notion, notion_page_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(issue_number) DO UPDATE SET
          title = excluded.title,
          description = excluded.description,
          status = excluded.status,
          closed_at = excluded.closed_at,
          labels = excluded.labels,
          assignees = excluded.assignees,
          comments_count = excluded.comments_count,
          synced_to_notion = excluded.synced_to_notion,
          notion_page_id = excluded.notion_page_id,
          last_updated = CURRENT_TIMESTAMP
      `;

      const params = [
        issueData.number,
        issueData.title,
        issueData.body || '',
        issueData.user.login,
        issueData.state,
        issueData.html_url,
        issueData.created_at,
        issueData.closed_at || null,
        issueData.labels ? issueData.labels.map(l => l.name).join(',') : '',
        issueData.assignees ? issueData.assignees.map(a => a.login).join(',') : '',
        issueData.comments || 0,
        issueData.milestone?.title || null,
        notionPageId ? 1 : 0,
        notionPageId
      ];

      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  // Buscar todos os PRs
  getAllPRs() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM pull_requests ORDER BY created_at DESC', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Buscar todas as Issues
  getAllIssues() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM issues ORDER BY created_at DESC', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Buscar estatísticas
  getStats() {
    return new Promise((resolve, reject) => {
      const stats = {};
      
      this.db.get('SELECT COUNT(*) as total, SUM(synced_to_notion) as synced FROM pull_requests', [], (err, row) => {
        if (err) return reject(err);
        stats.prs = row;
        
        this.db.get('SELECT COUNT(*) as total, SUM(synced_to_notion) as synced FROM issues', [], (err, row) => {
          if (err) return reject(err);
          stats.issues = row;
          resolve(stats);
        });
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

module.exports = Database;
