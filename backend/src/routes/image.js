import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// POST /api/image/generate — generate image from text prompt
router.post('/generate', authenticate, asyncHandler(async (req, res) => {
  const { prompt, width = 1024, height = 1024, retry = 0 } = req.body;

  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // Use Pollinations.ai — default to 'flux', switch to fast 'turbo' on retries
  const model = retry > 0 ? 'turbo' : 'flux';
  const encodedPrompt = encodeURIComponent(prompt.trim().slice(0, 500));
  const seed = Math.floor(Math.random() * 9999999);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=${model}&seed=${seed}&nologo=true`;

  res.json({
    url: imageUrl,
    prompt: prompt.trim(),
    model,
    seed,
  });
}));

export default router;
