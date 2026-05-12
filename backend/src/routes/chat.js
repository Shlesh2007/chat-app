import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../db/database.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { streamOllamaResponse } from '../services/ollama.js';
import { streamGroqResponse } from '../services/groq.js';
import { searchDocuments } from '../services/rag.js';

// Use Groq if API key is set, otherwise fall back to Ollama
const useGroq = () => !!process.env.GROQ_API_KEY;

const router = express.Router();

// POST /api/chat/:conversationId/message — send message with streaming
router.post('/:conversationId/message', authenticate, asyncHandler(async (req, res) => {
  const { content, displayContent, useRAG = false } = req.body;
  const { conversationId } = req.params;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Message content is required' });
  }

  const db = getDB();

  // Verify conversation belongs to user
  const conversation = db.prepare(`
    SELECT * FROM conversations WHERE id = ? AND user_id = ?
  `).get(conversationId, req.user.id);

  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  // Save user message — store clean display text, not raw file dump
  const userMsgId = uuidv4();
  const savedContent = displayContent?.trim() || content.trim();
  db.prepare(`INSERT INTO messages (id, conversation_id, role, content) VALUES (?, ?, 'user', ?)`)
    .run(userMsgId, conversationId, savedContent);

  // Update conversation timestamp
  db.prepare(`UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(conversationId);

  // Auto-title conversation from first message
  if (conversation.title === 'New Chat') {
    const shortTitle = content.trim().slice(0, 50) + (content.length > 50 ? '...' : '');
    db.prepare(`UPDATE conversations SET title = ? WHERE id = ?`).run(shortTitle, conversationId);
  }

  // Fetch conversation history EXCLUDING the message just saved (last 10 prior messages)
  const history = db.prepare(`
    SELECT role, content FROM messages
    WHERE conversation_id = ? AND id != ?
    ORDER BY created_at ASC
    LIMIT 10
  `).all(conversationId, userMsgId);

  // RAG context injection
  let ragContext = '';
  if (useRAG) {
    try {
      const docs = await searchDocuments(content, req.user.id);
      if (docs.length > 0) {
        ragContext = '\n\nRelevant context from uploaded documents:\n' +
          docs.map((d, i) => `[${i + 1}] ${d.pageContent}`).join('\n\n');
      }
    } catch (err) {
      console.warn('RAG search failed:', err.message);
    }
  }

  // Build messages array
  const systemPrompt = `You are a helpful AI assistant built by Shlesh Darji, a Computer Science Engineering student at LJ University.

IMPORTANT CAPABILITIES YOU HAVE:
- You CAN read and analyze files. Users can attach PDF, Word (.doc/.docx), Excel (.xls/.xlsx), CSV, TXT, Markdown, and all code files directly in the chat using the paperclip button.
- You CAN analyze images. When a user shares an image as base64 data (prefixed with [IMAGE ATTACHED:]), describe and analyze it in detail.
- When a user shares file content with you, analyze it fully and answer their questions about it.
- You CAN generate images. When asked to generate/draw/create an image, respond with: [GENERATE_IMAGE: detailed prompt here]
- You have memory of this conversation and can refer back to earlier messages.

IDENTITY:
- If anyone asks who made you, who built you, or who developed you — always say: "I was built by Shlesh Darji, a CSE student at LJ University."
- Never say you were made by Meta, OpenAI, or any other company.
- Never say you cannot receive or read files or images — you can, through the chat interface.

Answer all questions clearly, helpfully, and in detail.${ragContext}`;
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: content.trim() }, // full content (may include file text/image)
  ];

  // Set up SSE streaming
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
      await streamOllamaResponse(
        messages,
        conversation.model || process.env.OLLAMA_MODEL || 'llama3',
        (chunk) => {
          fullResponse += chunk;
          res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
        }
      );
    }

    // Save assistant message
    const assistantMsgId = uuidv4();
    db.prepare(`
      INSERT INTO messages (id, conversation_id, role, content)
      VALUES (?, ?, 'assistant', ?)
    `).run(assistantMsgId, conversationId, fullResponse);

    res.write(`data: ${JSON.stringify({ type: 'done', messageId: assistantMsgId })}\n\n`);
  } catch (err) {
    console.error('Streaming error:', err.message);
    res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
  } finally {
    res.end();
  }
}));

export default router;
