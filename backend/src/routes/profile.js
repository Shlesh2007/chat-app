import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { getDB } from '../db/database.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Cloudinary config ────────────────────────────────────────────────────────
const useCloudinary = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET &&
  process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name'
);

if (useCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// ── Multer storage — Cloudinary in prod, local disk in dev ───────────────────
const AVATAR_DIR = path.join(__dirname, '../../uploads/avatars');
fs.mkdirSync(AVATAR_DIR, { recursive: true });

const storage = useCloudinary
  ? new CloudinaryStorage({
      cloudinary,
      params: (req) => ({
        folder: 'chat-app-avatars',
        public_id: req.user.id,          // overwrite same file on re-upload
        overwrite: true,
        transformation: [{ width: 200, height: 200, crop: 'fill', gravity: 'face' }],
        format: 'jpg',
      }),
    })
  : multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, AVATAR_DIR),
      filename: (req, _file, cb) => cb(null, `${req.user.id}.jpg`),
    });

const avatarUpload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const ok = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(
      path.extname(file.originalname).toLowerCase()
    );
    cb(ok ? null : new Error('Images only'), ok);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ── Helper — get the URL from the uploaded file ──────────────────────────────
function getAvatarUrl(req, file) {
  if (useCloudinary) {
    // Cloudinary returns the secure URL on req.file
    return req.file.path; // multer-storage-cloudinary sets path = secure_url
  }
  return `/uploads/avatars/${req.user.id}.jpg`;
}

const router = express.Router();

router.get('/', authenticate, asyncHandler(async (req, res) => {
  const db = getDB();
  const result = await db.execute({
    sql: 'SELECT id,username,email,avatar,auto_delete,created_at FROM users WHERE id=?',
    args: [req.user.id],
  });
  res.json({ user: result.rows[0] });
}));

router.post('/avatar', authenticate, avatarUpload.single('avatar'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
  const avatarUrl = getAvatarUrl(req, req.file);
  const db = getDB();
  await db.execute({
    sql: 'UPDATE users SET avatar=?,updated_at=CURRENT_TIMESTAMP WHERE id=?',
    args: [avatarUrl, req.user.id],
  });
  res.json({ avatar: avatarUrl });
}));

router.delete('/avatar', authenticate, asyncHandler(async (req, res) => {
  const db = getDB();
  const result = await db.execute({
    sql: 'SELECT avatar FROM users WHERE id=?',
    args: [req.user.id],
  });
  const avatar = result.rows[0]?.avatar;

  if (avatar) {
    if (useCloudinary) {
      // Delete from Cloudinary using the user id as public_id
      try { await cloudinary.uploader.destroy(`chat-app-avatars/${req.user.id}`); } catch {}
    } else {
      // Delete local file
      const fp = path.join(__dirname, '../..', avatar);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    }
  }

  await db.execute({
    sql: 'UPDATE users SET avatar=NULL,updated_at=CURRENT_TIMESTAMP WHERE id=?',
    args: [req.user.id],
  });
  res.json({ success: true });
}));

router.patch('/', authenticate, asyncHandler(async (req, res) => {
  const { username, auto_delete } = req.body;
  const db = getDB();
  if (username !== undefined) {
    const ex = await db.execute({
      sql: 'SELECT id FROM users WHERE username=? AND id!=?',
      args: [username, req.user.id],
    });
    if (ex.rows.length) return res.status(409).json({ error: 'Username taken' });
    await db.execute({
      sql: 'UPDATE users SET username=?,updated_at=CURRENT_TIMESTAMP WHERE id=?',
      args: [username, req.user.id],
    });
  }
  if (auto_delete !== undefined) {
    await db.execute({
      sql: 'UPDATE users SET auto_delete=?,updated_at=CURRENT_TIMESTAMP WHERE id=?',
      args: [auto_delete ? 1 : 0, req.user.id],
    });
  }
  const updated = await db.execute({
    sql: 'SELECT id,username,email,avatar,auto_delete FROM users WHERE id=?',
    args: [req.user.id],
  });
  res.json({ user: updated.rows[0] });
}));

router.delete('/account', authenticate, asyncHandler(async (req, res) => {
  const db = getDB();
  // Also delete avatar from Cloudinary if exists
  if (useCloudinary) {
    try { await cloudinary.uploader.destroy(`chat-app-avatars/${req.user.id}`); } catch {}
  }
  await db.execute({ sql: 'DELETE FROM users WHERE id=?', args: [req.user.id] });
  res.json({ success: true });
}));

export default router;
