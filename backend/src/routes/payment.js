import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { getDB } from '../db/database.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Lazy-init so env vars are guaranteed loaded before instantiation
// Reset instance on every server start (no module-level caching across restarts)
let _razorpay = null;
function getRazorpay() {
  if (!_razorpay) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay keys not configured');
    }
    _razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    console.log(`💳 Razorpay init: ${process.env.RAZORPAY_KEY_ID}`);
  }
  return _razorpay;
}

// Credit packs
const PACKS = {
  starter: { credits: 100,  amount: 500,  label: '100 Credits' },
  popular: { credits: 500,  amount: 1000, label: '500 Credits' },
  pro:     { credits: 1200, amount: 2000, label: '1200 Credits' },
};

// POST /api/payment/order — create Razorpay order
router.post('/order', authenticate, asyncHandler(async (req, res) => {
  const { pack } = req.body;
  const selected = PACKS[pack];
  if (!selected) return res.status(400).json({ error: 'Invalid pack' });

  let order;
  try {
    order = await getRazorpay().orders.create({
      amount: selected.amount, // in paise
      currency: 'INR',
      receipt: `rcpt_${req.user.id.slice(0, 8)}_${Date.now().toString().slice(-8)}`,
      notes: { userId: req.user.id, pack, credits: selected.credits },
    });
  } catch (rzpErr) {
    // Razorpay SDK throws plain objects — normalise to a real Error
    const msg = rzpErr?.error?.description || rzpErr?.message || JSON.stringify(rzpErr);
    console.error('Razorpay order error:', msg);
    return res.status(502).json({ error: `Payment gateway error: ${msg}` });
  }

  res.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
    pack: selected,
  });
}));

// POST /api/payment/verify — verify payment and add credits
router.post('/verify', authenticate, asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, pack } = req.body;

  // Verify signature
  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSig = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expectedSig !== razorpay_signature) {
    return res.status(400).json({ error: 'Invalid payment signature' });
  }

  const selected = PACKS[pack];
  if (!selected) return res.status(400).json({ error: 'Invalid pack' });

  // Add credits to user
  const db = getDB();
  await db.execute({
    sql: 'UPDATE users SET credits = COALESCE(credits, 0) + ? WHERE id=?',
    args: [selected.credits, req.user.id],
  });

  const result = await db.execute({
    sql: 'SELECT credits FROM users WHERE id=?',
    args: [req.user.id],
  });

  res.json({
    success: true,
    credits: Number(result.rows[0].credits),
    added: selected.credits,
  });
}));

// GET /api/payment/credits — get current credits
router.get('/credits', authenticate, asyncHandler(async (req, res) => {
  const db = getDB();
  const result = await db.execute({
    sql: 'SELECT credits FROM users WHERE id=?',
    args: [req.user.id],
  });
  res.json({ credits: Number(result.rows[0]?.credits || 0) });
}));

export default router;
