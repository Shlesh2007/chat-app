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
  await db.execute({ sql: 'INSERT INTO users (id,username,email,password_hash,credits) VALUES (?,?,?,?,100)', args: [userId, username, email, passwordHash] });

  const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, user: { id: userId, username, email, credits: 100 } });
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

  // Auto-top-up admin account if credits run low
  const ADMIN_EMAIL = process.env.ADMIN_USER_EMAIL;
  if (ADMIN_EMAIL && user.email === ADMIN_EMAIL && Number(user.credits || 0) < 100) {
    await db.execute({ sql: 'UPDATE users SET credits = 9999 WHERE id=?', args: [user.id] });
    user.credits = 9999;
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, username: user.username, email: user.email, credits: Number(user.credits || 0) } });
}));

// ── Real Google OAuth 2.0 Verification ─────────────────────────────────
router.post('/google', asyncHandler(async (req, res) => {
  const { accessToken } = req.body;
  if (!accessToken) return res.status(400).json({ error: 'Google Access Token is required' });

  const googleRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`);
  if (!googleRes.ok) {
    return res.status(401).json({ error: 'Invalid or expired Google OAuth token' });
  }

  const profile = await googleRes.json();
  const email = profile.email;
  const username = profile.name ? profile.name.replace(/\s+/g, '_') : profile.email.split('@')[0];
  const avatar = profile.picture;

  if (!email) return res.status(400).json({ error: 'Google account email not accessible' });

  const db = getDB();
  const existing = await db.execute({ sql: 'SELECT * FROM users WHERE email=?', args: [email] });
  let user = existing.rows[0];

  if (!user) {
    const userId = uuidv4();
    const passwordHash = await bcrypt.hash(uuidv4(), 12);
    await db.execute({
      sql: 'INSERT INTO users (id,username,email,password_hash,credits,avatar) VALUES (?,?,?,?,100,?)',
      args: [userId, username, email, passwordHash, avatar || ''],
    });
    user = { id: userId, username, email, credits: 100, avatar };
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, username: user.username, email: user.email, credits: Number(user.credits || 0), avatar: user.avatar } });
}));

// ── Real GitHub OAuth 2.0 Verification ────────────────────────────────
router.post('/github', asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'GitHub authorization code is required' });

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    return res.status(401).json({ error: tokenData.error_description || 'Failed to exchange GitHub authorization code' });
  }

  const userRes = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': 'ChatApp-OAuth' },
  });
  const githubUser = await userRes.json();

  let email = githubUser.email;
  if (!email) {
    const emailsRes = await fetch('https://api.github.com/user/emails', {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': 'ChatApp-OAuth' },
    });
    const emails = await emailsRes.json();
    const primary = Array.isArray(emails) ? emails.find((e) => e.primary && e.verified) || emails[0] : null;
    email = primary?.email;
  }

  if (!email) return res.status(400).json({ error: 'GitHub account email not accessible' });

  const username = githubUser.login || email.split('@')[0];
  const avatar = githubUser.avatar_url;

  const db = getDB();
  const existing = await db.execute({ sql: 'SELECT * FROM users WHERE email=?', args: [email] });
  let user = existing.rows[0];

  if (!user) {
    const userId = uuidv4();
    const passwordHash = await bcrypt.hash(uuidv4(), 12);
    await db.execute({
      sql: 'INSERT INTO users (id,username,email,password_hash,credits,avatar) VALUES (?,?,?,?,100,?)',
      args: [userId, username, email, passwordHash, avatar || ''],
    });
    user = { id: userId, username, email, credits: 100, avatar };
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, username: user.username, email: user.email, credits: Number(user.credits || 0), avatar: user.avatar } });
}));

router.post('/oauth', asyncHandler(async (req, res) => {
  const { provider, email, username } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required for OAuth authentication' });

  const db = getDB();
  const existing = await db.execute({ sql: 'SELECT * FROM users WHERE email=?', args: [email] });
  let user = existing.rows[0];

  if (!user) {
    const userId = uuidv4();
    const finalUsername = username || email.split('@')[0] + '_' + Math.floor(Math.random() * 1000);
    const passwordHash = await bcrypt.hash(uuidv4(), 12);
    await db.execute({
      sql: 'INSERT INTO users (id,username,email,password_hash,credits) VALUES (?,?,?,?,100)',
      args: [userId, finalUsername, email, passwordHash],
    });
    user = { id: userId, username: finalUsername, email, credits: 100 };
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, username: user.username, email: user.email, credits: Number(user.credits || 0) } });
}));

router.get('/me', authenticate, asyncHandler(async (req, res) => {
  res.json({ user: req.user });
}));

export default router;
