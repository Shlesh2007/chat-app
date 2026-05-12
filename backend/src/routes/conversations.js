import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../db/database.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

router.get('/', authenticate, asyncHandler(async (req, res) => {
  const db = getDB();
  const result = await db.execute({ sql: 'SELECT * FROM conversations WHERE user_id=? ORDER BY updated_at DESC', args: [req.user.id] });
  res.json({ conversations: result.rows });
}));

router.post('/', authenticate, asyncHandler(async (req, res) => {
  const { title = 'New Chat' } = req.body;
  const db = getDB();
  const id = uuidv4();
  await db.execute({ sql: 'INSERT INTO conversations (id,user_id,title) VALUES (?,?,?)', args: [id, req.user.id, title] });
  const result = await db.execute({ sql: 'SELECT * FROM conversations WHERE id=?', args: [id] });
  res.status(201).json({ conversation: result.rows[0] });
}));

router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const db = getDB();
  const conv = await db.execute({ sql: 'SELECT * FROM conversations WHERE id=? AND user_id=?', args: [req.params.id, req.user.id] });
  if (!conv.rows[0]) return res.status(404).json({ error: 'Not found' });
  const msgs = await db.execute({ sql: 'SELECT * FROM messages WHERE conversation_id=? ORDER BY created_at ASC', args: [req.params.id] });
  res.json({ conversation: conv.rows[0], messages: msgs.rows });
}));

router.patch('/:id', authenticate, asyncHandler(async (req, res) => {
  const { title } = req.body;
  const db = getDB();
  const conv = await db.execute({ sql: 'SELECT id FROM conversations WHERE id=? AND user_id=?', args: [req.params.id, req.user.id] });
  if (!conv.rows[0]) return res.status(404).json({ error: 'Not found' });
  await db.execute({ sql: 'UPDATE conversations SET title=?, updated_at=CURRENT_TIMESTAMP WHERE id=?', args: [title, req.params.id] });
  res.json({ success: true });
}));

router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  const db = getDB();
  const conv = await db.execute({ sql: 'SELECT id FROM conversations WHERE id=? AND user_id=?', args: [req.params.id, req.user.id] });
  if (!conv.rows[0]) return res.status(404).json({ error: 'Not found' });
  await db.execute({ sql: 'DELETE FROM messages WHERE conversation_id=?', args: [req.params.id] });
  await db.execute({ sql: 'DELETE FROM conversations WHERE id=?', args: [req.params.id] });
  res.json({ success: true });
}));

export default router;
