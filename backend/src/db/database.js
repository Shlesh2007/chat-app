import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, '../../data/chat.db');

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

let _db = null;

function persist() {
  const data = _db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function wrapDB(db) {
  return {
    exec(sql) { db.run(sql); persist(); },
    prepare(sql) {
      return {
        run(...params) { db.run(sql, params); persist(); },
        get(...params) {
          const stmt = db.prepare(sql);
          stmt.bind(params);
          const row = stmt.step() ? stmt.getAsObject() : undefined;
          stmt.free();
          return row;
        },
        all(...params) {
          const stmt = db.prepare(sql);
          stmt.bind(params);
          const rows = [];
          while (stmt.step()) rows.push(stmt.getAsObject());
          stmt.free();
          return rows;
        },
      };
    },
    pragma() {},
  };
}

export function getDB() {
  if (!_db) throw new Error('Database not initialized. Call initDB() first.');
  return wrapDB(_db);
}

export async function initDB() {
  if (_db) return;
  const SQL = await initSqlJs();
  _db = fs.existsSync(DB_PATH)
    ? new SQL.Database(fs.readFileSync(DB_PATH))
    : new SQL.Database();

  _db.run('PRAGMA foreign_keys = ON;');

  _db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar TEXT DEFAULT NULL,
      auto_delete INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Add new columns to existing users table if upgrading
  try { _db.run(`ALTER TABLE users ADD COLUMN avatar TEXT DEFAULT NULL;`); } catch {}
  try { _db.run(`ALTER TABLE users ADD COLUMN auto_delete INTEGER DEFAULT 0;`); } catch {}

  _db.run(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT 'New Chat',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  _db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    );
  `);

  _db.run(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  _db.run(`CREATE INDEX IF NOT EXISTS idx_conv_user ON conversations(user_id);`);
  _db.run(`CREATE INDEX IF NOT EXISTS idx_msg_conv ON messages(conversation_id);`);
  _db.run(`CREATE INDEX IF NOT EXISTS idx_doc_user ON documents(user_id);`);

  persist();
  console.log('✅ Database initialized at', DB_PATH);
}
