import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../db/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: 'All fields required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const db = getDB();
  const existing = await db.execute({ sql: 'SELECT id FROM users WHERE email=? OR username=?', args: [email, username] });
  if (existing.rows.length) return res.status(409).json({ error: 'User already exists' });

  const passwordHash = await bcrypt.hash(password, 12);
  const userId = uuidv4();
  await db.execute({ sql: 'INSERT INTO users (id,username,email,password_hash) VALUES (?,?,?,?)', args: [userId, username, email, passwordHash] });

  const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, user: { id: userId, username, email } });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const db = getDB();
  const result = await db.execute({ sql: 'SELECT * FROM users WHERE email=?', args: [email] });
  const user = result.rows[0];
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
}));

router.get('/me', authenticate, asyncHandler(async (req, res) => {
  res.json({ user: req.user });
}));

export default router;
