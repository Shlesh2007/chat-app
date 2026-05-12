import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { getDB } from '../db/database.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { extractFileText } from '../services/pdfReader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED = new Set(['.pdf','.txt','.md','.doc','.docx','.xls','.xlsx','.csv',
  '.js','.jsx','.ts','.tsx','.py','.java','.c','.cpp','.cs','.go','.rs','.php','.rb',
  '.html','.css','.json','.xml','.yaml','.yml','.sql','.sh','.bat']);

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
  }),
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(ALLOWED.has(ext) ? null : new Error('File type not supported'), ALLOWED.has(ext));
  },
  limits: { fileSize: 25 * 1024 * 1024 },
});

const router = express.Router();

router.post('/', authenticate, upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const { filename, originalname, size } = req.file;
  const fileType = path.extname(originalname).toLowerCase().slice(1);
  const filePath = path.join(UPLOAD_DIR, filename);

  let extractedText = '';
  try { extractedText = await extractFileText(filePath, fileType); } catch {}
  if (extractedText.trim()) fs.writeFileSync(filePath + '.txt', extractedText, 'utf-8');

  const db = getDB();
  const docId = uuidv4();
  await db.execute({ sql: 'INSERT INTO documents (id,user_id,filename,original_name,file_type,file_size) VALUES (?,?,?,?,?,?)', args: [docId, req.user.id, filename, originalname, fileType, size] });

  res.status(201).json({ document: { id: docId, filename, originalName: originalname, fileType, fileSize: size, textLength: extractedText.length } });
}));

router.get('/', authenticate, asyncHandler(async (req, res) => {
  const db = getDB();
  const result = await db.execute({ sql: 'SELECT * FROM documents WHERE user_id=? ORDER BY created_at DESC', args: [req.user.id] });
  res.json({ documents: result.rows });
}));

router.get('/:id/text', authenticate, asyncHandler(async (req, res) => {
  const db = getDB();
  const result = await db.execute({ sql: 'SELECT * FROM documents WHERE id=? AND user_id=?', args: [req.params.id, req.user.id] });
  const doc = result.rows[0];
  if (!doc) return res.status(404).json({ error: 'Not found' });
  const filePath = path.join(UPLOAD_DIR, doc.filename);
  const txtPath = filePath + '.txt';
  let text = fs.existsSync(txtPath) ? fs.readFileSync(txtPath, 'utf-8') : await extractFileText(filePath, doc.file_type);
  res.json({ text, filename: doc.original_name });
}));

router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  const db = getDB();
  const result = await db.execute({ sql: 'SELECT * FROM documents WHERE id=? AND user_id=?', args: [req.params.id, req.user.id] });
  const doc = result.rows[0];
  if (!doc) return res.status(404).json({ error: 'Not found' });
  const fp = path.join(UPLOAD_DIR, doc.filename);
  if (fs.existsSync(fp)) fs.unlinkSync(fp);
  if (fs.existsSync(fp + '.txt')) fs.unlinkSync(fp + '.txt');
  await db.execute({ sql: 'DELETE FROM documents WHERE id=?', args: [req.params.id] });
  res.json({ success: true });
}));

export default router;
