import express from 'express';
import jwt from 'jsonwebtoken';
import { getDB } from '../db/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// ── Admin auth middleware ─────────────────────────────────────────────────────
function adminAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// POST /api/admin/login — static credentials
router.post('/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  if (
    username !== process.env.ADMIN_USERNAME ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }
  const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ token });
}));

// GET /api/admin/users — list all users
router.get('/users', adminAuth, asyncHandler(async (req, res) => {
  const db = getDB();
  const result = await db.execute(`
    SELECT id, username, email, avatar,
      COALESCE(is_blocked, 0) as is_blocked,
      COALESCE(spam_count, 0) as spam_count,
      COALESCE(credits, 0) as credits,
      created_at
    FROM users
    ORDER BY created_at DESC
  `);
  res.json({ users: result.rows });
}));

// GET /api/admin/stats — overall stats
router.get('/stats', adminAuth, asyncHandler(async (req, res) => {
  const db = getDB();
  // single query instead of 4 round trips
  const result = await db.execute(`
    SELECT
      (SELECT COUNT(*) FROM users) as totalUsers,
      (SELECT COUNT(*) FROM conversations) as totalConversations,
      (SELECT COUNT(*) FROM messages) as totalMessages,
      (SELECT COUNT(*) FROM users WHERE is_blocked=1) as blockedUsers
  `);
  const row = result.rows[0];
  res.json({
    totalUsers: row.totalUsers,
    totalConversations: row.totalConversations,
    totalMessages: row.totalMessages,
    blockedUsers: row.blockedUsers,
  });
}));

// PATCH /api/admin/users/:id/block — block a user with optional reason
router.patch('/users/:id/block', adminAuth, asyncHandler(async (req, res) => {
  const { reason = '' } = req.body;
  const db = getDB();
  await db.execute({ sql: 'UPDATE users SET is_blocked=1, block_reason=? WHERE id=?', args: [reason, req.params.id] });
  res.json({ success: true, message: 'User blocked' });
}));

// PATCH /api/admin/users/:id/unblock — unblock a user
router.patch('/users/:id/unblock', adminAuth, asyncHandler(async (req, res) => {
  const db = getDB();
  await db.execute({ sql: 'UPDATE users SET is_blocked=0, block_reason=NULL, spam_count=0 WHERE id=?', args: [req.params.id] });
  res.json({ success: true, message: 'User unblocked' });
}));

// DELETE /api/admin/users/:id — delete a user
router.delete('/users/:id', adminAuth, asyncHandler(async (req, res) => {
  const db = getDB();
  await db.execute({ sql: 'DELETE FROM users WHERE id=?', args: [req.params.id] });
  res.json({ success: true, message: 'User deleted' });
}));

// PATCH /api/admin/users/:id/credits — add credits to a user
router.patch('/users/:id/credits', adminAuth, asyncHandler(async (req, res) => {
  const { credits } = req.body;
  const n = parseInt(credits, 10);
  if (!n || n < 1 || n > 10000) {
    return res.status(400).json({ error: 'Credits must be between 1 and 10000' });
  }
  const db = getDB();
  await db.execute({
    sql: 'UPDATE users SET credits = COALESCE(credits, 0) + ? WHERE id=?',
    args: [n, req.params.id],
  });
  const result = await db.execute({ sql: 'SELECT credits FROM users WHERE id=?', args: [req.params.id] });
  res.json({ success: true, credits: Number(result.rows[0]?.credits || 0) });
}));

// PATCH /api/admin/users/:id/password — reset a user's password
router.patch('/users/:id/password', adminAuth, asyncHandler(async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  const bcrypt = (await import('bcryptjs')).default;
  const hash = await bcrypt.hash(newPassword, 12);
  const db = getDB();
  await db.execute({ sql: 'UPDATE users SET password_hash=?,updated_at=CURRENT_TIMESTAMP WHERE id=?', args: [hash, req.params.id] });
  res.json({ success: true, message: 'Password updated' });
}));

// POST /api/admin/change-password — change admin password
router.post('/change-password', adminAuth, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (currentPassword !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }
  process.env.ADMIN_PASSWORD = newPassword;
  res.json({
    success: true,
    message: 'Password changed. Update ADMIN_PASSWORD in Render env vars to make it permanent.',
    newPassword,
  });
}));

// GET /api/admin/feedbacks — list all pending appeals
router.get('/feedbacks', adminAuth, asyncHandler(async (req, res) => {
  const db = getDB();
  const result = await db.execute(
    "SELECT * FROM feedbacks ORDER BY created_at DESC"
  );
  res.json({ feedbacks: result.rows });
}));

// PATCH /api/admin/feedbacks/:id/accept — accept appeal, unblock user
router.patch('/feedbacks/:id/accept', adminAuth, asyncHandler(async (req, res) => {
  const { reply = 'Your appeal has been accepted. You have been unblocked.' } = req.body;
  const db = getDB();
  const fb = await db.execute({ sql: 'SELECT * FROM feedbacks WHERE id=?', args: [req.params.id] });
  if (!fb.rows[0]) return res.status(404).json({ error: 'Feedback not found' });

  await db.execute({ sql: "UPDATE feedbacks SET status='accepted', admin_reply=? WHERE id=?", args: [reply, req.params.id] });
  await db.execute({ sql: 'UPDATE users SET is_blocked=0, block_reason=NULL, spam_count=0 WHERE id=?', args: [fb.rows[0].user_id] });
  res.json({ success: true });
}));

// PATCH /api/admin/feedbacks/:id/reject — reject appeal, keep blocked
router.patch('/feedbacks/:id/reject', adminAuth, asyncHandler(async (req, res) => {
  const { reply = 'Your appeal has been reviewed and rejected. You remain blocked.' } = req.body;
  const db = getDB();
  const fb = await db.execute({ sql: 'SELECT * FROM feedbacks WHERE id=?', args: [req.params.id] });
  if (!fb.rows[0]) return res.status(404).json({ error: 'Feedback not found' });

  await db.execute({ sql: "UPDATE feedbacks SET status='rejected', admin_reply=? WHERE id=?", args: [reply, req.params.id] });
  res.json({ success: true });
}));

// GET /api/admin/users/:id/conversations
router.get('/users/:id/conversations', adminAuth, asyncHandler(async (req, res) => {
  const db = getDB();
  const result = await db.execute({
    sql: 'SELECT * FROM conversations WHERE user_id=? ORDER BY updated_at DESC',
    args: [req.params.id],
  });
  res.json({ conversations: result.rows });
}));

// GET /api/admin/users/:id/spam-logs
router.get('/users/:id/spam-logs', adminAuth, asyncHandler(async (req, res) => {
  const db = getDB();
  const result = await db.execute({
    sql: 'SELECT * FROM spam_logs WHERE user_id=? ORDER BY created_at DESC',
    args: [req.params.id],
  });
  res.json({ logs: result.rows });
}));

// GET /api/admin/conversations/:id/messages
router.get('/conversations/:id/messages', adminAuth, asyncHandler(async (req, res) => {
  const db = getDB();
  const result = await db.execute({
    sql: 'SELECT * FROM messages WHERE conversation_id=? ORDER BY created_at ASC',
    args: [req.params.id],
  });
  res.json({ messages: result.rows });
}));

export default router;
