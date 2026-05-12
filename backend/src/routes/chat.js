import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../db/database.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { streamOllamaResponse } from '../services/ollama.js';
import { streamGroqResponse } from '../services/groq.js';
import { searchDocuments } from '../services/rag.js';

const useGroq = () => !!process.env.GROQ_API_KEY;

const router = express.Router();

router.post('/:conversationId/message', authenticate, asyncHandler(async (req, res) => {
  const { content, displayContent, useRAG = false } = req.body;
  const { conversationId } = req.params;

  if (!content?.trim()) return res.status(400).json({ error: 'Message content is required' });

  const db = getDB();
  const convResult = await db.execute({ sql: 'SELECT * FROM conversations WHERE id=? AND user_id=?', args: [conversationId, req.user.id] });
  const conversation = convResult.rows[0];
  if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

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

  const systemPrompt = `You are a helpful AI assistant built by Shlesh Darji, a CSE student at LJ University.
- You CAN read files (PDF, Word, Excel, CSV, code) attached via the paperclip button.
- You CAN analyze images shared in chat.
- You CAN generate images — respond with: [GENERATE_IMAGE: detailed prompt]
- If asked who built you: "I was built by Shlesh Darji, a CSE student at LJ University."
- Never say you cannot receive files or images.
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
    res.write(`data: ${JSON.stringify({ type: 'done', messageId: assistantMsgId })}\n\n`);
  } catch (err) {
    console.error('Streaming error:', err.message);
    res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
  } finally {
    res.end();
  }
}));

export default router;
