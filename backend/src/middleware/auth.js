import jwt from 'jsonwebtoken';
import { getDB } from '../db/database.js';

export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const db = getDB();
    const result = await db.execute({
      sql: 'SELECT id,username,email,avatar,auto_delete,is_blocked,block_reason,credits FROM users WHERE id=?',
      args: [decoded.userId]
    });
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'User not found' });
    if (user.is_blocked) {
      return res.status(403).json({
        error: 'BLOCKED',
        reason: user.block_reason || 'You have been blocked by the admin.',
        userId: user.id,
      });
    }
    req.user = user;
    getDB().execute({ sql: 'UPDATE users SET last_seen=CURRENT_TIMESTAMP WHERE id=?', args: [user.id] }).catch(() => {});
    next();
  } catch (err) {
    return res.status(401).json({ error: err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token' });
  }
}
