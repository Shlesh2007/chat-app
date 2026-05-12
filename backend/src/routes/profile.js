import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getDB } from '../db/database.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AVATAR_DIR = path.join(__dirname, '../../uploads/avatars');
fs.mkdirSync(AVATAR_DIR, { recursive: true });

const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, AVATAR_DIR),
    filename: (req, _file, cb) => cb(null, `${req.user.id}.jpg`),
  }),
  fileFilter: (_req, file, cb) => {
    const ok = ['.jpg','.jpeg','.png','.gif','.webp'].includes(path.extname(file.originalname).toLowerCase());
    cb(ok ? null : new Error('Images only'), ok);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

const router = express.Router();

router.get('/', authenticate, asyncHandler(async (req, res) => {
  const db = getDB();
  const result = await db.execute({ sql: 'SELECT id,username,email,avatar,auto_delete,created_at FROM users WHERE id=?', args: [req.user.id] });
  res.json({ user: result.rows[0] });
}));

router.post('/avatar', authenticate, avatarUpload.single('avatar'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
  const avatarUrl = `/uploads/avatars/${req.file.filename}`;
  const db = getDB();
  await db.execute({ sql: 'UPDATE users SET avatar=?,updated_at=CURRENT_TIMESTAMP WHERE id=?', args: [avatarUrl, req.user.id] });
  res.json({ avatar: avatarUrl });
}));

router.delete('/avatar', authenticate, asyncHandler(async (req, res) => {
  const db = getDB();
  const result = await db.execute({ sql: 'SELECT avatar FROM users WHERE id=?', args: [req.user.id] });
  const avatar = result.rows[0]?.avatar;
  if (avatar) {
    const fp = path.join(__dirname, '../..', avatar);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
  }
  await db.execute({ sql: 'UPDATE users SET avatar=NULL,updated_at=CURRENT_TIMESTAMP WHERE id=?', args: [req.user.id] });
  res.json({ success: true });
}));

router.patch('/', authenticate, asyncHandler(async (req, res) => {
  const { username, auto_delete } = req.body;
  const db = getDB();
  if (username !== undefined) {
    const ex = await db.execute({ sql: 'SELECT id FROM users WHERE username=? AND id!=?', args: [username, req.user.id] });
    if (ex.rows.length) return res.status(409).json({ error: 'Username taken' });
    await db.execute({ sql: 'UPDATE users SET username=?,updated_at=CURRENT_TIMESTAMP WHERE id=?', args: [username, req.user.id] });
  }
  if (auto_delete !== undefined) {
    await db.execute({ sql: 'UPDATE users SET auto_delete=?,updated_at=CURRENT_TIMESTAMP WHERE id=?', args: [auto_delete ? 1 : 0, req.user.id] });
  }
  const updated = await db.execute({ sql: 'SELECT id,username,email,avatar,auto_delete FROM users WHERE id=?', args: [req.user.id] });
  res.json({ user: updated.rows[0] });
}));

router.delete('/account', authenticate, asyncHandler(async (req, res) => {
  const db = getDB();
  await db.execute({ sql: 'DELETE FROM users WHERE id=?', args: [req.user.id] });
  res.json({ success: true });
}));

export default router;
