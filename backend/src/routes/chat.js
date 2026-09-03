import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../db/database.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { streamOllamaResponse } from '../services/ollama.js';
import { streamGroqResponse, moderateMessage } from '../services/groq.js';
import { searchDocuments } from '../services/rag.js';

const useGroq = () => !!process.env.GROQ_API_KEY;

const AUTO_BLOCK_THRESHOLD = 3; // auto-block after 3 spam strikes
const ADMIN_EMAIL = process.env.ADMIN_USER_EMAIL || 'shleshdarji317@gmail.com'; // never block this account

const router = express.Router();

router.post('/:conversationId/message', authenticate, asyncHandler(async (req, res) => {
  const { content, displayContent, useRAG = false } = req.body;
  const { conversationId } = req.params;

  if (!content?.trim()) return res.status(400).json({ error: 'Message content is required' });

  const db = getDB();
  const convResult = await db.execute({ sql: 'SELECT * FROM conversations WHERE id=? AND user_id=?', args: [conversationId, req.user.id] });
  const conversation = convResult.rows[0];
  if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

  // ── Credits check ────────────────────────────────────────────────────────
  // Everyone needs credits — admin account gets a large pool, not a free pass
  const credRow = await db.execute({ sql: 'SELECT credits FROM users WHERE id=?', args: [req.user.id] });
  const credits = Number(credRow.rows[0]?.credits || 0);
  if (credits <= 0) {
    return res.status(402).json({ error: 'NO_CREDITS', message: 'You have no credits left. Please purchase more to continue.' });
  }
  // ────────────────────────────────────────────────────────────────────────

  // ── Spam moderation ──────────────────────────────────────────────────────
  // Skip moderation entirely for the admin account
  if (useGroq() && req.user.email !== ADMIN_EMAIL) {
    const { flagged, reason } = await moderateMessage(content);
    if (flagged) {
      // log the strike with message + reason
      await db.execute({
        sql: 'INSERT INTO spam_logs (id, user_id, message, reason) VALUES (?, ?, ?, ?)',
        args: [uuidv4(), req.user.id, content.trim().slice(0, 500), reason],
      });

      // increment spam_count
      await db.execute({
        sql: 'UPDATE users SET spam_count = COALESCE(spam_count, 0) + 1 WHERE id=?',
        args: [req.user.id],
      });

      // fetch updated count
      const userRow = await db.execute({ sql: 'SELECT spam_count FROM users WHERE id=?', args: [req.user.id] });
      const spamCount = Number(userRow.rows[0]?.spam_count || 0);

      // auto-block if threshold reached
      if (spamCount >= AUTO_BLOCK_THRESHOLD) {
        await db.execute({
          sql: 'UPDATE users SET is_blocked=1, block_reason=? WHERE id=?',
          args: [`Auto-blocked after ${AUTO_BLOCK_THRESHOLD} spam violations`, req.user.id],
        });
        return res.status(403).json({
          error: 'BLOCKED',
          reason: `You have been automatically blocked due to repeated policy violations.`,
        });
      }

      const remaining = AUTO_BLOCK_THRESHOLD - spamCount;
      return res.status(400).json({
        error: 'SPAM_DETECTED',
        reason,
        spamCount,
        warning: `Your message was flagged as inappropriate. ${remaining} warning${remaining === 1 ? '' : 's'} remaining before your account is blocked.`,
      });
    }
  }
  // ────────────────────────────────────────────────────────────────────────

  // Save user message (clean display text)
  const userMsgId = uuidv4();
  const savedContent = displayContent?.trim() || content.trim();
  await db.execute({ sql: 'INSERT INTO messages (id,conversation_id,role,content) VALUES (?,?,?,?)', args: [userMsgId, conversationId, 'user', savedContent] });
  await db.execute({ sql: 'UPDATE conversations SET updated_at=CURRENT_TIMESTAMP WHERE id=?', args: [conversationId] });

  // Auto-title
  if (conversation.title === 'New Chat') {
    const shortTitle = content.trim().slice(0, 50) + (content.length > 50 ? '...' : '');
    await db.execute({ sql: 'UPDATE conversations SET title=? WHERE id=?', args: [shortTitle, conversationId] });
  }

  // History (exclude current message)
  const histResult = await db.execute({
    sql: 'SELECT role,content FROM messages WHERE conversation_id=? AND id!=? ORDER BY created_at ASC LIMIT 10',
    args: [conversationId, userMsgId]
  });
  const history = histResult.rows;

  // RAG
  let ragContext = '';
  if (useRAG) {
    try {
      const docs = await searchDocuments(content, req.user.id);
      if (docs.length > 0) ragContext = '\n\nRelevant context:\n' + docs.map((d, i) => `[${i + 1}] ${d.pageContent}`).join('\n\n');
    } catch {}
  }

  const systemPrompt = `You are an advanced AI assistant built by Shlesh Darji, a CSE student at LJ University.
- You operate like ChatGPT: intelligent, natural, helpful, creative, and capable.
- Do NOT output reasoning blocks, <think> tags, or internal chain-of-thought analysis. Output ONLY the final direct response.
- You CAN read files (PDF, Word, Excel, CSV, code) attached via the paperclip button.
- You CAN analyze and generate images.
- IMAGE GENERATION & EDITING (LIKE CHATGPT + DALL-E):
  Whenever the user asks to generate, create, edit, style, draw, or transform an image (including image attachment requests like "generate image of this boy in professional clothes", "make it Ghibli style", "convert to anime", "draw a logo"):
  1. Understand the user's request, subject, and desired style naturally.
  2. Synthesize a detailed, high-quality visual prompt describing the subject, outfit, lighting, composition, and artistic style.
  3. Output ONLY the tag in this format: [GENERATE_IMAGE: <your detailed visual prompt>]
- Never output markdown image links, raw image URLs, or "Failed to load image" text yourself.
- If asked who built you: "I was built by Shlesh Darji, a CSE student at LJ University."
Answer clearly and helpfully.${ragContext}`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: content.trim() },
  ];

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  let fullResponse = '';

  try {
    if (useGroq()) {
      await streamGroqResponse(messages, (chunk) => {
        fullResponse += chunk;
        res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
      });
    } else {
      await streamOllamaResponse(messages, process.env.OLLAMA_MODEL || 'llama3', (chunk) => {
        fullResponse += chunk;
        res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
      });
    }

    const assistantMsgId = uuidv4();
    await db.execute({ sql: 'INSERT INTO messages (id,conversation_id,role,content) VALUES (?,?,?,?)', args: [assistantMsgId, conversationId, 'assistant', fullResponse] });

    // Deduct 1 credit on successful response
    await db.execute({ sql: 'UPDATE users SET credits = MAX(0, credits - 1) WHERE id=?', args: [req.user.id] });

    res.write(`data: ${JSON.stringify({ type: 'done', messageId: assistantMsgId })}\n\n`);
  } catch (err) {
    console.error('Streaming error:', err.message);
    res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
  } finally {
    res.end();
  }
}));

export default router;
