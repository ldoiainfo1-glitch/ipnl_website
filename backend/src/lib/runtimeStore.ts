import { randomUUID } from 'crypto';

export type IntroStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
export type KycStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
export type MandateModerationStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
export type NotificationType =
  | 'INTRO_RECEIVED'
  | 'INTRO_ACCEPTED'
  | 'INTRO_DECLINED'
  | 'MESSAGE_RECEIVED'
  | 'MANDATE_UPDATED'
  | 'KYC_APPROVED'
  | 'KYC_REJECTED'
  | 'TIER_UPGRADED';

export interface IntroRecord {
  id: string;
  mandateId: string;
  senderId: string;
  receiverId: string;
  status: IntroStatus;
  message?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  respondedAt?: string;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface KycRecord {
  id: string;
  userId: string;
  status: KycStatus;
  panCard?: string;
  gstCertificate?: string;
  reraCertificate?: string;
  incorporationCertificate?: string;
  addressProof?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  reviewNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MandateReviewRecord {
  mandateId: string;
  status: MandateModerationStatus;
  note?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionRecord {
  userId: string;
  tier: 'OBSERVER' | 'VERIFIED' | 'ENTERPRISE';
  isActive: boolean;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  invoices: Array<{
    id: string;
    amount: number;
    status: string;
    invoiceUrl: string;
    createdAt: string;
  }>;
}

const intros = new Map<string, IntroRecord>();
const notifications = new Map<string, NotificationRecord>();
const kycByUser = new Map<string, KycRecord>();
const subscriptions = new Map<string, SubscriptionRecord>();
const mandateReviewsByMandateId = new Map<string, MandateReviewRecord>();

export function listIntros(): IntroRecord[] {
  return Array.from(intros.values());
}

export function getIntro(id: string): IntroRecord | undefined {
  return intros.get(id);
}

export function putIntro(input: Omit<IntroRecord, 'id' | 'createdAt' | 'updatedAt' | 'expiresAt'> & Partial<Pick<IntroRecord, 'id' | 'createdAt' | 'updatedAt' | 'expiresAt'>>): IntroRecord {
  const now = new Date().toISOString();
  const record: IntroRecord = {
    id: input.id ?? randomUUID(),
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
    expiresAt: input.expiresAt ?? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    mandateId: input.mandateId,
    senderId: input.senderId,
    receiverId: input.receiverId,
    status: input.status,
    message: input.message,
    respondedAt: input.respondedAt,
  };
  intros.set(record.id, record);
  return record;
}

export function listNotificationsForUser(userId: string): NotificationRecord[] {
  return Array.from(notifications.values())
    .filter((n) => n.userId === userId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getNotification(id: string): NotificationRecord | undefined {
  return notifications.get(id);
}

export function putNotification(
  input: Omit<NotificationRecord, 'id' | 'createdAt' | 'isRead'> & Partial<Pick<NotificationRecord, 'id' | 'createdAt' | 'isRead'>>,
): NotificationRecord {
  const record: NotificationRecord = {
    id: input.id ?? randomUUID(),
    createdAt: input.createdAt ?? new Date().toISOString(),
    isRead: input.isRead ?? false,
    userId: input.userId,
    type: input.type,
    title: input.title,
    message: input.message,
    relatedEntityId: input.relatedEntityId,
    relatedEntityType: input.relatedEntityType,
    readAt: input.readAt,
  };
  notifications.set(record.id, record);
  return record;
}

export function updateNotification(id: string, patch: Partial<NotificationRecord>): NotificationRecord | undefined {
  const current = notifications.get(id);
  if (!current) return undefined;
  const next = { ...current, ...patch };
  notifications.set(id, next);
  return next;
}

export function deleteNotification(id: string): boolean {
  return notifications.delete(id);
}

export function getKycByUser(userId: string): KycRecord | undefined {
  return kycByUser.get(userId);
}

export function putKyc(
  input: Omit<KycRecord, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<KycRecord, 'id' | 'createdAt' | 'updatedAt'>>,
): KycRecord {
  const now = new Date().toISOString();
  const record: KycRecord = {
    id: input.id ?? randomUUID(),
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
    userId: input.userId,
    status: input.status,
    panCard: input.panCard,
    gstCertificate: input.gstCertificate,
    reraCertificate: input.reraCertificate,
    incorporationCertificate: input.incorporationCertificate,
    addressProof: input.addressProof,
    reviewedBy: input.reviewedBy,
    reviewedAt: input.reviewedAt,
    rejectionReason: input.rejectionReason,
    reviewNote: input.reviewNote,
  };
  kycByUser.set(record.userId, record);
  return record;
}

export function listKyc(): KycRecord[] {
  return Array.from(kycByUser.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getOrCreateSubscription(userId: string): SubscriptionRecord {
  const existing = subscriptions.get(userId);
  if (existing) return existing;

  const next: SubscriptionRecord = {
    userId,
    tier: 'OBSERVER',
    isActive: false,
    cancelAtPeriodEnd: false,
    invoices: [],
  };
  subscriptions.set(userId, next);
  return next;
}

export function putSubscription(sub: SubscriptionRecord): SubscriptionRecord {
  subscriptions.set(sub.userId, sub);
  return sub;
}

export function getMandateReview(mandateId: string): MandateReviewRecord | undefined {
  return mandateReviewsByMandateId.get(mandateId);
}

export function listMandateReviews(): MandateReviewRecord[] {
  return Array.from(mandateReviewsByMandateId.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function putMandateReview(
  input: Omit<MandateReviewRecord, 'createdAt' | 'updatedAt'> & Partial<Pick<MandateReviewRecord, 'createdAt' | 'updatedAt'>>,
): MandateReviewRecord {
  const now = new Date().toISOString();
  const existing = mandateReviewsByMandateId.get(input.mandateId);
  const record: MandateReviewRecord = {
    mandateId: input.mandateId,
    status: input.status,
    note: input.note,
    reviewedBy: input.reviewedBy,
    reviewedAt: input.reviewedAt,
    createdAt: input.createdAt ?? existing?.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
  };
  mandateReviewsByMandateId.set(record.mandateId, record);
  return record;
}
