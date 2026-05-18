import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../db/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// POST /api/feedback — blocked user submits appeal (no auth required)
router.post('/', asyncHandler(async (req, res) => {
  const { userId, message } = req.body;
  if (!userId || !message?.trim()) {
    return res.status(400).json({ error: 'userId and message are required' });
  }

  const db = getDB();
  const userResult = await db.execute({
    sql: 'SELECT id, username, email, is_blocked FROM users WHERE id=?',
    args: [userId]
  });
  const user = userResult.rows[0];
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (!user.is_blocked) return res.status(400).json({ error: 'User is not blocked' });

  // Check if already has pending feedback
  const existing = await db.execute({
    sql: "SELECT id FROM feedbacks WHERE user_id=? AND status='pending'",
    args: [userId]
  });
  if (existing.rows.length > 0) {
    return res.status(400).json({ error: 'You already have a pending appeal. Please wait for admin review.' });
  }

  const id = uuidv4();
  await db.execute({
    sql: 'INSERT INTO feedbacks (id, user_id, username, email, message) VALUES (?,?,?,?,?)',
    args: [id, userId, user.username, user.email, message.trim()]
  });

  res.status(201).json({ success: true, message: 'Your appeal has been submitted. You will be notified once reviewed.' });
}));

// GET /api/feedback/status/:userId — check appeal status
router.get('/status/:userId', asyncHandler(async (req, res) => {
  const db = getDB();

  // First check if user is actually still blocked
  const userResult = await db.execute({
    sql: 'SELECT is_blocked FROM users WHERE id=?',
    args: [req.params.userId],
  });
  const user = userResult.rows[0];

  // If user is not blocked, their appeal is irrelevant — return none
  if (!user || !user.is_blocked) return res.json({ status: 'none' });

  // User is blocked — return their latest appeal status
  const result = await db.execute({
    sql: "SELECT status, admin_reply, created_at FROM feedbacks WHERE user_id=? ORDER BY created_at DESC LIMIT 1",
    args: [req.params.userId],
  });
  const feedback = result.rows[0];
  if (!feedback) return res.json({ status: 'none' });
  res.json(feedback);
}));

export default router;
