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
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const ALLOWED_EXTENSIONS = new Set([
  // Documents
  '.pdf', '.txt', '.md', '.markdown',
  '.doc', '.docx',
  '.xls', '.xlsx', '.csv',
  // Code files
  '.js', '.jsx', '.ts', '.tsx', '.mjs',
  '.py', '.java', '.c', '.cpp', '.cs',
  '.go', '.rs', '.php', '.rb', '.swift', '.kt',
  '.html', '.htm', '.css', '.scss',
  '.json', '.xml', '.yaml', '.yml', '.toml',
  '.sh', '.bat', '.sql', '.r',
]);

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_EXTENSIONS.has(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not supported. Allowed: PDF, Word, Excel, CSV, TXT, and code files.`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

const router = express.Router();

// POST /api/upload — upload document and extract text
router.post('/', authenticate, upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { filename, originalname, size } = req.file;
  const fileType = path.extname(originalname).toLowerCase().slice(1);
  const filePath = path.join(UPLOAD_DIR, filename);

  // Extract text from the file
  let extractedText = '';
  try {
    extractedText = await extractFileText(filePath, fileType);
  } catch (err) {
    console.warn('Text extraction failed:', err.message);
  }

  // Save to DB with extracted text
  const db = getDB();
  const docId = uuidv4();
  db.prepare(`
    INSERT INTO documents (id, user_id, filename, original_name, file_type, file_size, chunk_count)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(docId, req.user.id, filename, originalname, fileType, size, 1);

  // Save extracted text to a sidecar .txt file for easy retrieval
  if (extractedText.trim()) {
    fs.writeFileSync(filePath + '.extracted.txt', extractedText, 'utf-8');
  }

  res.status(201).json({
    document: {
      id: docId,
      filename,
      originalName: originalname,
      fileType,
      fileSize: size,
      textLength: extractedText.length,
      preview: extractedText.slice(0, 200),
    },
  });
}));

// GET /api/upload — list user documents
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const db = getDB();
  const documents = db.prepare(`
    SELECT * FROM documents WHERE user_id = ? ORDER BY created_at DESC
  `).all(req.user.id);
  res.json({ documents });
}));

// GET /api/upload/:id/text — get extracted text of a document
router.get('/:id/text', authenticate, asyncHandler(async (req, res) => {
  const db = getDB();
  const doc = db.prepare(`
    SELECT * FROM documents WHERE id = ? AND user_id = ?
  `).get(req.params.id, req.user.id);

  if (!doc) return res.status(404).json({ error: 'Document not found' });

  const filePath = path.join(UPLOAD_DIR, doc.filename);
  const extractedPath = filePath + '.extracted.txt';

  let text = '';
  if (fs.existsSync(extractedPath)) {
    text = fs.readFileSync(extractedPath, 'utf-8');
  } else {
    try {
      text = await extractFileText(filePath, doc.file_type);
    } catch (err) {
      return res.status(500).json({ error: 'Could not extract text: ' + err.message });
    }
  }

  res.json({ text, filename: doc.original_name });
}));

// DELETE /api/upload/:id
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  const db = getDB();
  const doc = db.prepare(`
    SELECT * FROM documents WHERE id = ? AND user_id = ?
  `).get(req.params.id, req.user.id);

  if (!doc) return res.status(404).json({ error: 'Document not found' });

  const filePath = path.join(UPLOAD_DIR, doc.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  if (fs.existsSync(filePath + '.extracted.txt')) fs.unlinkSync(filePath + '.extracted.txt');

  db.prepare('DELETE FROM documents WHERE id = ?').run(req.params.id);
  res.json({ success: true });
}));

export default router;
