import express from 'express';
import { verifySupabase } from '../middleware/verifySupabase';
import { notFound, unauthorized } from '../utils/apiError';
import {
  deleteNotificationForUser,
  getNotificationForUser,
  listNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
} from '../lib/notificationsStore';

const router = express.Router();

router.get('/', verifySupabase, async (req, res) => {
  if (!req.user) return unauthorized(res);

  const page = Math.max(1, parseInt((req.query.page as string) || '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '20', 10) || 20));
  const from = (page - 1) * limit;
  const to = from + limit;

  const items = (await listNotificationsForUser(req.user.id)).slice(from, to);
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

router.get('/unread-count', verifySupabase, async (req, res) => {
  if (!req.user) return unauthorized(res);
  const count = (await listNotificationsForUser(req.user.id)).filter((n) => !n.isRead).length;
  return res.json({ count });
});

router.patch('/:id/read', verifySupabase, async (req, res) => {
  if (!req.user) return unauthorized(res);

  const record = await getNotificationForUser(req.params.id, req.user.id);
  if (!record) return notFound(res, 'Notification not found');

  const updated = await markNotificationRead(req.params.id, req.user.id);
  return res.json(updated);
});

router.patch('/read-all', verifySupabase, async (req, res) => {
  if (!req.user) return unauthorized(res);

  await markAllNotificationsRead(req.user.id);
  return res.json({ success: true });
});

router.delete('/:id', verifySupabase, async (req, res) => {
  if (!req.user) return unauthorized(res);
  const record = await getNotificationForUser(req.params.id, req.user.id);
  if (!record) return notFound(res, 'Notification not found');
  await deleteNotificationForUser(req.params.id, req.user.id);
  return res.json({ success: true });
});

export default router;
