import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// POST /api/image/generate — generate image from text prompt
router.post('/generate', authenticate, asyncHandler(async (req, res) => {
  const { prompt, width = 1024, height = 1024, model = 'flux' } = req.body;

  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // Use Pollinations.ai — completely free, no API key needed
  const encodedPrompt = encodeURIComponent(prompt.trim());
  const seed = Math.floor(Math.random() * 999999);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=${model}&seed=${seed}&nologo=true`;

  res.json({
    url: imageUrl,
    prompt: prompt.trim(),
    width,
    height,
  });
}));

export default router;
