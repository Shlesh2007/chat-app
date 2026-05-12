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

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, AVATAR_DIR),
  filename: (req, file, cb) => cb(null, `${req.user.id}${path.extname(file.originalname)}`),
});

const avatarUpload = multer({
  storage: avatarStorage,
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Only image files allowed'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const router = express.Router();

// GET /api/profile — get current user profile
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const db = getDB();
  const user = db.prepare(`
    SELECT id, username, email, avatar, auto_delete, created_at FROM users WHERE id = ?
  `).get(req.user.id);
  res.json({ user });
}));

// POST /api/profile/avatar — upload profile photo
router.post('/avatar', authenticate, avatarUpload.single('avatar'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

  const avatarUrl = `/uploads/avatars/${req.file.filename}`;
  const db = getDB();
  db.prepare(`UPDATE users SET avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .run(avatarUrl, req.user.id);

  res.json({ avatar: avatarUrl });
}));

// DELETE /api/profile/avatar — remove profile photo
router.delete('/avatar', authenticate, asyncHandler(async (req, res) => {
  const db = getDB();
  const user = db.prepare(`SELECT avatar FROM users WHERE id = ?`).get(req.user.id);

  if (user?.avatar) {
    const filePath = path.join(__dirname, '../..', user.avatar);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  db.prepare(`UPDATE users SET avatar = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .run(req.user.id);

  res.json({ success: true });
}));

// PATCH /api/profile — update username or auto_delete setting
router.patch('/', authenticate, asyncHandler(async (req, res) => {
  const { username, auto_delete } = req.body;
  const db = getDB();

  if (username !== undefined) {
    const existing = db.prepare(`SELECT id FROM users WHERE username = ? AND id != ?`)
      .get(username, req.user.id);
    if (existing) return res.status(409).json({ error: 'Username already taken' });
    db.prepare(`UPDATE users SET username = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .run(username, req.user.id);
  }

  if (auto_delete !== undefined) {
    db.prepare(`UPDATE users SET auto_delete = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .run(auto_delete ? 1 : 0, req.user.id);
  }

  const updated = db.prepare(`
    SELECT id, username, email, avatar, auto_delete FROM users WHERE id = ?
  `).get(req.user.id);

  res.json({ user: updated });
}));

// POST /api/profile/delete-account — delete everything
router.delete('/account', authenticate, asyncHandler(async (req, res) => {
  const db = getDB();
  db.prepare(`DELETE FROM users WHERE id = ?`).run(req.user.id);
  res.json({ success: true });
}));

export default router;
