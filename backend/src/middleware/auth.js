import jwt from 'jsonwebtoken';
import { getDB } from '../db/database.js';

export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const db = getDB();
    const result = await db.execute({ sql: 'SELECT id,username,email,avatar,auto_delete FROM users WHERE id=?', args: [decoded.userId] });
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token' });
  }
}
