import { getSupabaseAdmin } from './supabaseServer';
import {
  deleteNotification as deleteRuntimeNotification,
  getNotification as getRuntimeNotification,
  listNotificationsForUser as listRuntimeNotificationsForUser,
  NotificationRecord,
  putNotification as putRuntimeNotification,
  updateNotification as updateRuntimeNotification,
} from './runtimeStore';

type NotificationRow = {
  id: string;
  user_id: string;
  type: NotificationRecord['type'];
  title: string;
  message: string;
  related_entity_id: string | null;
  related_entity_type: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};

function mapNotification(row: NotificationRow): NotificationRecord {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    relatedEntityId: row.related_entity_id ?? undefined,
    relatedEntityType: row.related_entity_type ?? undefined,
    isRead: row.is_read,
    readAt: row.read_at ?? undefined,
    createdAt: row.created_at,
  };
}

export async function createNotification(input: Omit<NotificationRecord, 'id' | 'createdAt' | 'isRead'> & Partial<Pick<NotificationRecord, 'id' | 'createdAt' | 'isRead'>>): Promise<NotificationRecord> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return putRuntimeNotification(input);

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      id: input.id,
      user_id: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      related_entity_id: input.relatedEntityId,
      related_entity_type: input.relatedEntityType,
      is_read: input.isRead ?? false,
      read_at: input.readAt,
      created_at: input.createdAt,
    })
    .select('*')
    .single();

  if (error || !data) return putRuntimeNotification(input);
  return mapNotification(data as NotificationRow);
}

export async function listNotificationsForUser(userId: string): Promise<NotificationRecord[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return listRuntimeNotificationsForUser(userId);

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return listRuntimeNotificationsForUser(userId);
  return (data as NotificationRow[]).map(mapNotification);
}

export async function getNotificationForUser(id: string, userId: string): Promise<NotificationRecord | undefined> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    const record = getRuntimeNotification(id);
    return record?.userId === userId ? record : undefined;
  }

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) {
    const record = getRuntimeNotification(id);
    return record?.userId === userId ? record : undefined;
  }
  return mapNotification(data as NotificationRow);
}

export async function markNotificationRead(id: string, userId: string): Promise<NotificationRecord | undefined> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  if (!supabase) {
    const record = getRuntimeNotification(id);
    if (!record || record.userId !== userId) return undefined;
    return updateRuntimeNotification(id, { isRead: true, readAt: now });
  }

  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: now })
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .maybeSingle();

  if (error || !data) return undefined;
  return mapNotification(data as NotificationRow);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  if (!supabase) {
    for (const item of listRuntimeNotificationsForUser(userId)) {
      if (!item.isRead) updateRuntimeNotification(item.id, { isRead: true, readAt: now });
    }
    return;
  }

  await supabase
    .from('notifications')
    .update({ is_read: true, read_at: now })
    .eq('user_id', userId)
    .eq('is_read', false);
}

export async function deleteNotificationForUser(id: string, userId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    const record = getRuntimeNotification(id);
    if (!record || record.userId !== userId) return false;
    return deleteRuntimeNotification(id);
  }

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  return !error;
}