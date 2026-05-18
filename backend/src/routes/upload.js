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

// Always use a temp dir for processing — we extract text then discard the file
const TEMP_DIR = path.join(__dirname, '../../uploads/temp');
fs.mkdirSync(TEMP_DIR, { recursive: true });

const ALLOWED = new Set(['.pdf','.txt','.md','.doc','.docx','.xls','.xlsx','.csv',
  '.js','.jsx','.ts','.tsx','.py','.java','.c','.cpp','.cs','.go','.rs','.php','.rb',
  '.html','.css','.json','.xml','.yaml','.yml','.sql','.sh','.bat']);

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, TEMP_DIR),
    filename: (_req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
  }),
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(ALLOWED.has(ext) ? null : new Error('File type not supported'), ALLOWED.has(ext));
  },
  limits: { fileSize: 25 * 1024 * 1024 },
});

const router = express.Router();

// POST /api/upload — upload file, extract text, store text in DB, delete file
router.post('/', authenticate, upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const { filename, originalname, size } = req.file;
  const fileType = path.extname(originalname).toLowerCase().slice(1);
  const tempPath = path.join(TEMP_DIR, filename);

  let extractedText = '';
  try {
    extractedText = await extractFileText(tempPath, fileType);
  } catch (e) {
    extractedText = '';
  } finally {
    // Always delete the temp file after extraction
    try { fs.unlinkSync(tempPath); } catch {}
  }

  const db = getDB();
  const docId = uuidv4();

  // Store extracted text directly in DB — no file storage needed
  await db.execute({
    sql: 'INSERT INTO documents (id,user_id,filename,original_name,file_type,file_size,extracted_text) VALUES (?,?,?,?,?,?,?)',
    args: [docId, req.user.id, filename, originalname, fileType, size, extractedText.slice(0, 100000)],
  });

  res.status(201).json({
    document: {
      id: docId,
      filename,
      originalName: originalname,
      fileType,
      fileSize: size,
      textLength: extractedText.length,
    },
  });
}));

// GET /api/upload — list user's documents
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const db = getDB();
  const result = await db.execute({
    sql: 'SELECT id,filename,original_name,file_type,file_size,created_at FROM documents WHERE user_id=? ORDER BY created_at DESC',
    args: [req.user.id],
  });
  res.json({ documents: result.rows });
}));

// GET /api/upload/:id/text — get extracted text from DB
router.get('/:id/text', authenticate, asyncHandler(async (req, res) => {
  const db = getDB();
  const result = await db.execute({
    sql: 'SELECT * FROM documents WHERE id=? AND user_id=?',
    args: [req.params.id, req.user.id],
  });
  const doc = result.rows[0];
  if (!doc) return res.status(404).json({ error: 'Not found' });

  // Return text from DB column if available
  if (doc.extracted_text) {
    return res.json({ text: doc.extracted_text, filename: doc.original_name });
  }

  // Fallback: try old local file path for backwards compatibility
  const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
  const filePath = path.join(UPLOAD_DIR, doc.filename);
  const txtPath = filePath + '.extracted.txt';
  if (fs.existsSync(txtPath)) {
    return res.json({ text: fs.readFileSync(txtPath, 'utf-8'), filename: doc.original_name });
  }
  if (fs.existsSync(filePath)) {
    const text = await extractFileText(filePath, doc.file_type);
    return res.json({ text, filename: doc.original_name });
  }

  res.json({ text: '', filename: doc.original_name });
}));

// DELETE /api/upload/:id
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  const db = getDB();
  const result = await db.execute({
    sql: 'SELECT * FROM documents WHERE id=? AND user_id=?',
    args: [req.params.id, req.user.id],
  });
  const doc = result.rows[0];
  if (!doc) return res.status(404).json({ error: 'Not found' });

  // Try to clean up any old local files if they exist
  const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
  const fp = path.join(UPLOAD_DIR, doc.filename);
  try { if (fs.existsSync(fp)) fs.unlinkSync(fp); } catch {}
  try { if (fs.existsSync(fp + '.extracted.txt')) fs.unlinkSync(fp + '.extracted.txt'); } catch {}

  await db.execute({ sql: 'DELETE FROM documents WHERE id=?', args: [req.params.id] });
  res.json({ success: true });
}));

export default router;
