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
  try {
    const result = await db.execute(`
      SELECT id, username, email, avatar,
        COALESCE(is_blocked, 0) as is_blocked,
        COALESCE(last_seen, created_at) as last_seen,
        created_at
      FROM users
      ORDER BY created_at DESC
    `);
    res.json({ users: result.rows });
  } catch {
    // Fallback if new columns don't exist yet
    const result = await db.execute(`
      SELECT id, username, email, avatar, created_at,
        0 as is_blocked, created_at as last_seen
      FROM users ORDER BY created_at DESC
    `);
    res.json({ users: result.rows });
  }
}));

// GET /api/admin/stats — overall stats
router.get('/stats', adminAuth, asyncHandler(async (req, res) => {
  const db = getDB();
  const [users, convs, msgs] = await Promise.all([
    db.execute('SELECT COUNT(*) as count FROM users'),
    db.execute('SELECT COUNT(*) as count FROM conversations'),
    db.execute('SELECT COUNT(*) as count FROM messages'),
  ]);
  let blockedCount = 0;
  try {
    const b = await db.execute('SELECT COUNT(*) as count FROM users WHERE is_blocked=1');
    blockedCount = b.rows[0].count;
  } catch {}

  res.json({
    totalUsers: users.rows[0].count,
    totalConversations: convs.rows[0].count,
    totalMessages: msgs.rows[0].count,
    blockedUsers: blockedCount,
  });
}));

// PATCH /api/admin/users/:id/block — block a user
router.patch('/users/:id/block', adminAuth, asyncHandler(async (req, res) => {
  const db = getDB();
  await db.execute({ sql: 'UPDATE users SET is_blocked=1 WHERE id=?', args: [req.params.id] });
  res.json({ success: true, message: 'User blocked' });
}));

// PATCH /api/admin/users/:id/unblock — unblock a user
router.patch('/users/:id/unblock', adminAuth, asyncHandler(async (req, res) => {
  const db = getDB();
  await db.execute({ sql: 'UPDATE users SET is_blocked=0 WHERE id=?', args: [req.params.id] });
  res.json({ success: true, message: 'User unblocked' });
}));

// DELETE /api/admin/users/:id — delete a user
router.delete('/users/:id', adminAuth, asyncHandler(async (req, res) => {
  const db = getDB();
  await db.execute({ sql: 'DELETE FROM users WHERE id=?', args: [req.params.id] });
  res.json({ success: true, message: 'User deleted' });
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

// GET /api/admin/users/:id/conversations
router.get('/users/:id/conversations', adminAuth, asyncHandler(async (req, res) => {
  const db = getDB();
  const result = await db.execute({
    sql: 'SELECT * FROM conversations WHERE user_id=? ORDER BY updated_at DESC',
    args: [req.params.id],
  });
  res.json({ conversations: result.rows });
}));

export default router;
