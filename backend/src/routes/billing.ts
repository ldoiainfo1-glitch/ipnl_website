import express from 'express';
import { randomUUID } from 'crypto';
import { verifySupabase } from '../middleware/verifySupabase';
import { badRequest, unauthorized } from '../utils/apiError';
import { getOrCreateSubscription, putSubscription } from '../lib/runtimeStore';

const router = express.Router();

router.post('/checkout', verifySupabase, (req, res) => {
  if (!req.user) return unauthorized(res);

  const body = req.body as { tier?: 'OBSERVER' | 'VERIFIED' | 'ENTERPRISE' };
  if (!body.tier || !['OBSERVER', 'VERIFIED', 'ENTERPRISE'].includes(body.tier)) {
    return badRequest(res, 'tier must be OBSERVER, VERIFIED, or ENTERPRISE');
  }

  const sub = getOrCreateSubscription(req.user.id);
  sub.tier = body.tier;
  sub.isActive = body.tier !== 'OBSERVER';
  sub.cancelAtPeriodEnd = false;
  sub.currentPeriodEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  sub.invoices.unshift({
    id: randomUUID(),
    amount: body.tier === 'VERIFIED' ? 24000 : body.tier === 'ENTERPRISE' ? 100000 : 0,
    status: 'paid',
    invoiceUrl: '#',
    createdAt: new Date().toISOString(),
  });
  putSubscription(sub);

  return res.json({
    sessionId: randomUUID(),
    checkoutUrl: '#',
  });
});

router.get('/subscription', verifySupabase, (req, res) => {
  if (!req.user) return unauthorized(res);

  const sub = getOrCreateSubscription(req.user.id);
  return res.json({
    tier: sub.tier,
    isActive: sub.isActive,
    currentPeriodEnd: sub.currentPeriodEnd,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
  });
});

router.post('/cancel', verifySupabase, (req, res) => {
  if (!req.user) return unauthorized(res);

  const sub = getOrCreateSubscription(req.user.id);
  sub.cancelAtPeriodEnd = true;
  putSubscription(sub);

  return res.json({ success: true });
});

router.get('/invoices', verifySupabase, (req, res) => {
  if (!req.user) return unauthorized(res);

  const sub = getOrCreateSubscription(req.user.id);
  return res.json(sub.invoices);
});

export default router;
