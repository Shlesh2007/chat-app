import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../db/database.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// GET /api/conversations — list all for user
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const db = getDB();
  const conversations = db.prepare(`
    SELECT * FROM conversations
    WHERE user_id = ?
    ORDER BY updated_at DESC
  `).all(req.user.id);

  res.json({ conversations });
}));

// POST /api/conversations — create new
router.post('/', authenticate, asyncHandler(async (req, res) => {
  const { title = 'New Chat' } = req.body;
  const db = getDB();
  const id = uuidv4();
  db.prepare(`INSERT INTO conversations (id, user_id, title) VALUES (?, ?, ?)`)
    .run(id, req.user.id, title);

  const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(id);
  res.status(201).json({ conversation });
}));

// GET /api/conversations/:id — get with messages
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const db = getDB();
  const conversation = db.prepare(`
    SELECT * FROM conversations WHERE id = ? AND user_id = ?
  `).get(req.params.id, req.user.id);

  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  const messages = db.prepare(`
    SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC
  `).all(req.params.id);

  res.json({ conversation, messages });
}));

// PATCH /api/conversations/:id — update title
router.patch('/:id', authenticate, asyncHandler(async (req, res) => {
  const { title } = req.body;
  const db = getDB();

  const conversation = db.prepare(`
    SELECT * FROM conversations WHERE id = ? AND user_id = ?
  `).get(req.params.id, req.user.id);

  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  db.prepare(`
    UPDATE conversations SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(title, req.params.id);

  res.json({ success: true });
}));

// DELETE /api/conversations/:id
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  const db = getDB();

  const conversation = db.prepare(`
    SELECT * FROM conversations WHERE id = ? AND user_id = ?
  `).get(req.params.id, req.user.id);

  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  db.prepare('DELETE FROM conversations WHERE id = ?').run(req.params.id);
  res.json({ success: true });
}));

export default router;
