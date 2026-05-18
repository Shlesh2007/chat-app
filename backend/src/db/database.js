import { createClient } from '@libsql/client';

let _db = null;

export function getDB() {
  if (!_db) throw new Error('DB not initialized');
  return _db;
}

export async function initDB() {
  if (_db) return;

  if (!process.env.TURSO_URL || !process.env.TURSO_TOKEN) {
    throw new Error('Missing TURSO_URL or TURSO_TOKEN environment variables');
  }

  _db = createClient({
    url: process.env.TURSO_URL,
    authToken: process.env.TURSO_TOKEN,
  });

  // Create tables one by one — most reliable with Turso HTTP
  await _db.execute(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    avatar TEXT DEFAULT NULL,
    auto_delete INTEGER DEFAULT 0,
    is_blocked INTEGER DEFAULT 0,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await _db.execute(`CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT 'New Chat',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await _db.execute(`CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await _db.execute(`CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Indexes — wrapped in try/catch since they may already exist
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_conv_user ON conversations(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_msg_conv ON messages(conversation_id)',
    'CREATE INDEX IF NOT EXISTS idx_doc_user ON documents(user_id)',
  ];
  for (const sql of indexes) {
    try { await _db.execute(sql); } catch {}
  }

  // Migrations — add new columns if they don't exist yet
  const migrations = [
    'ALTER TABLE users ADD COLUMN is_blocked INTEGER DEFAULT 0',
    'ALTER TABLE users ADD COLUMN last_seen DATETIME DEFAULT CURRENT_TIMESTAMP',
  ];
  for (const sql of migrations) {
    try { await _db.execute(sql); } catch {} // ignore if column already exists
  }

  console.log('✅ Turso database initialized');
}
