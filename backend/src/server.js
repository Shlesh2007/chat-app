import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDB } from './db/database.js';
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';
import uploadRoutes from './routes/upload.js';
import conversationRoutes from './routes/conversations.js';
import imageRoutes from './routes/image.js';
import profileRoutes from './routes/profile.js';
import adminRoutes from './routes/admin.js';
import feedbackRoutes from './routes/feedback.js';
import { errorHandler } from './middleware/errorHandler.js';
import { startScheduler } from './services/scheduler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: (origin, cb) => cb(null, true), // allow all in production (Vercel + local)
  credentials: true,
}));

// General rate limit — returns JSON so clients can parse it
const generalLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json({ error: 'Too many requests, please try again later.' }),
});

// Admin rate limit — more lenient, separate window
const adminLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json({ error: 'Too many requests, please try again later.' }),
});

app.use('/api/admin', adminLimit);
app.use(generalLimit);

// Health check — no rate limit, always fast
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/image', imageRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use(errorHandler);

initDB().then(() => {
  startScheduler();
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🤖 AI: ${process.env.GROQ_API_KEY ? 'Groq (' + process.env.GROQ_MODEL + ')' : 'Local LLM'}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use. Kill the old process and retry.`);
    } else {
      console.error('Server error:', err.message);
    }
    process.exit(1);
  });
}).catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
