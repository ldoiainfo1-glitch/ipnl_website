import { Database } from '../types/database';
import { createPrivateLogoObjectViewUrl, createPrivateObjectViewUrl } from '../lib/objectStorage';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

interface UserStats {
  mandatesPosted?: number;
  introsSent?: number;
  introsReceived?: number;
  kycStatus?: 'NOT_SUBMITTED' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
}

/**
 * Returns a usable logo URL or null.
 * Detects which S3 bucket the logo is stored in and uses the correct
 * credentials to sign the URL (main bucket vs logos bucket).
 * - Placeholder URLs → null
 * - URLs from logos bucket → signed with logos credentials
 * - URLs from main bucket → signed with main bucket credentials
 * - If signing is skipped (no credentials) → null (avoids 403 in the browser)
 */
async function resolveLogoUrl(rawUrl: string | null): Promise<string | null> {
  if (!rawUrl) return null;
  if (rawUrl.includes('placeholder.local')) return null;
  try {
    const logosBucket = (process.env.AWS_S3_LOGOS_BUCKET || 'ipnl-logos').trim();
    const mainBucket = (process.env.AWS_S3_BUCKET || 'ipnl-bucket').trim();

    // Use the correct signing function based on which bucket the URL references
    const resolved = rawUrl.includes(mainBucket) && !rawUrl.includes(logosBucket)
      ? await createPrivateObjectViewUrl(rawUrl)
      : await createPrivateLogoObjectViewUrl(rawUrl);

    if (resolved === rawUrl && /amazonaws\.com/i.test(rawUrl)) {
      console.warn('[resolveLogoUrl] AWS credentials missing — logo will not be shown');
      return null;
    }
    return resolved;
  } catch (err: any) {
    console.warn('[resolveLogoUrl] Failed to sign logo URL:', err.message);
    return null;
  }
}

export async function toUserDTO(row: ProfileRow, stats: UserStats = {}) {
  const logo = await resolveLogoUrl(row.logo);

  return {
    id: row.id,
    email: row.email ?? '',
    mobile: row.mobile ?? '',
    companyName: row.company_name ?? '',
    role: normalizeRole(row.role),
    tier: normalizeTier(row.tier),
    status: normalizeStatus(row.status),
    kycStatus: stats.kycStatus ?? normalizeKycStatus(row.kyc_status),
    companyDescription: row.company_description ?? '',
    website: row.website ?? '',
    linkedin: row.linkedin ?? '',
    logo,
    city: row.city ?? '',
    state: row.state ?? '',
    assetPreferences: row.asset_preferences ?? [],
    ticketSizeMin: row.ticket_size_min != null ? Number(row.ticket_size_min) : undefined,
    ticketSizeMax: row.ticket_size_max != null ? Number(row.ticket_size_max) : undefined,
    reputationScore: row.reputation_score ?? 50,
    totalIntrosSent: stats.introsSent ?? 0,
    totalIntrosReceived: stats.introsReceived ?? 0,
    totalMandatesPosted: stats.mandatesPosted ?? 0,
    introQuotaLimit: row.intro_quota_limit ?? (normalizeTier(row.tier) === 'VERIFIED' ? 10 : normalizeTier(row.tier) === 'ENTERPRISE' ? 9999 : 0),
    introQuotaUsed: row.intro_quota_used ?? stats.introsSent ?? 0,
    billingAnniversary: undefined,
    isAnonymous: normalizeTier(row.tier) === 'OBSERVER',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastLoginAt: undefined,
  };
}

function normalizeStatus(status: string): 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' {
  if (status === 'APPROVED' || status === 'REJECTED' || status === 'SUSPENDED' || status === 'PENDING_VERIFICATION') return status;
  return 'PENDING_VERIFICATION';
}

function normalizeKycStatus(status: string): 'NOT_SUBMITTED' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' {
  if (status === 'NOT_SUBMITTED' || status === 'SUBMITTED' || status === 'UNDER_REVIEW' || status === 'APPROVED' || status === 'REJECTED') return status;
  return 'NOT_SUBMITTED';
}

function normalizeTier(tier: string): 'OBSERVER' | 'VERIFIED' | 'ENTERPRISE' {
  if (tier === 'VERIFIED' || tier === 'ENTERPRISE' || tier === 'OBSERVER') return tier;
  return 'OBSERVER';
}

function normalizeRole(role: string): 'DEVELOPER' | 'BROKER' | 'FAMILY_OFFICE' | 'HNI' | 'NBFC_FUND_REIT' | 'LAND_AGGREGATOR' | 'ADMIN' {
  const allowed = new Set(['DEVELOPER', 'BROKER', 'FAMILY_OFFICE', 'HNI', 'NBFC_FUND_REIT', 'LAND_AGGREGATOR', 'ADMIN']);
  if (allowed.has(role)) return role as 'DEVELOPER' | 'BROKER' | 'FAMILY_OFFICE' | 'HNI' | 'NBFC_FUND_REIT' | 'LAND_AGGREGATOR' | 'ADMIN';
  return 'DEVELOPER';
}