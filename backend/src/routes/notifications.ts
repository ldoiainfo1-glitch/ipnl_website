import express from 'express';
import { verifySupabase } from '../middleware/verifySupabase';
import { notFound, unauthorized } from '../utils/apiError';
import {
  deleteNotification,
  getNotification,
  listNotificationsForUser,
  updateNotification,
} from '../lib/runtimeStore';

const router = express.Router();

router.get('/', verifySupabase, (req, res) => {
  if (!req.user) return unauthorized(res);

  const page = Math.max(1, parseInt((req.query.page as string) || '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '20', 10) || 20));
  const from = (page - 1) * limit;
  const to = from + limit;

  const items = listNotificationsForUser(req.user.id).slice(from, to);
  return res.json(
    items.map((n) => ({
      id: n.id,
      userId: n.userId,
      type: n.type,
      title: n.title,
      message: n.message,
      relatedEntityId: n.relatedEntityId,
      relatedEntityType: n.relatedEntityType,
      isRead: n.isRead,
      readAt: n.readAt,
      createdAt: n.createdAt,
    })),
  );
});

router.get('/unread-count', verifySupabase, (req, res) => {
  if (!req.user) return unauthorized(res);
  const count = listNotificationsForUser(req.user.id).filter((n) => !n.isRead).length;
  return res.json({ count });
});

router.patch('/:id/read', verifySupabase, (req, res) => {
  if (!req.user) return unauthorized(res);

  const record = getNotification(req.params.id);
  if (!record || record.userId !== req.user.id) return notFound(res, 'Notification not found');

  const updated = updateNotification(req.params.id, { isRead: true, readAt: new Date().toISOString() });
  return res.json(updated);
});

router.patch('/read-all', verifySupabase, (req, res) => {
  if (!req.user) return unauthorized(res);

  const items = listNotificationsForUser(req.user.id);
  const now = new Date().toISOString();
  for (const item of items) {
    if (!item.isRead) updateNotification(item.id, { isRead: true, readAt: now });
  }
  return res.json({ success: true });
});

router.delete('/:id', verifySupabase, (req, res) => {
  if (!req.user) return unauthorized(res);
  const record = getNotification(req.params.id);
  if (!record || record.userId !== req.user.id) return notFound(res, 'Notification not found');
  deleteNotification(req.params.id);
  return res.json({ success: true });
});

export default router;
