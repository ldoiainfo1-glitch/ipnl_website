import { Database } from '../types/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

interface UserStats {
  mandatesPosted?: number;
  introsSent?: number;
  introsReceived?: number;
  kycStatus?: 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
}

export function toUserDTO(row: ProfileRow, stats: UserStats = {}) {
  return {
    id: row.id,
    email: row.email ?? '',
    mobile: '',
    companyName: row.company_name ?? 'Unknown Company',
    role: normalizeRole(row.role),
    tier: normalizeTier(row.tier),
    status: 'APPROVED' as const,
    kycStatus: stats.kycStatus ?? ('SUBMITTED' as const),

    companyDescription: '',
    website: '',
    linkedin: '',
    city: '',
    state: '',
    assetPreferences: [],
    ticketSizeMin: undefined,
    ticketSizeMax: undefined,

    reputationScore: 50,
    totalIntrosSent: stats.introsSent ?? 0,
    totalIntrosReceived: stats.introsReceived ?? 0,
    totalMandatesPosted: stats.mandatesPosted ?? 0,

    introQuotaLimit: normalizeTier(row.tier) === 'VERIFIED' ? 10 : normalizeTier(row.tier) === 'ENTERPRISE' ? 9999 : 0,
    introQuotaUsed: stats.introsSent ?? 0,
    billingAnniversary: undefined,

    isAnonymous: normalizeTier(row.tier) === 'OBSERVER',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastLoginAt: undefined,
  };
}

function normalizeTier(tier: string): 'OBSERVER' | 'VERIFIED' | 'ENTERPRISE' {
  if (tier === 'VERIFIED' || tier === 'ENTERPRISE' || tier === 'OBSERVER') return tier;
  return 'OBSERVER';
}

function normalizeRole(role: string):
  | 'DEVELOPER'
  | 'BROKER'
  | 'FAMILY_OFFICE'
  | 'HNI'
  | 'NBFC_FUND_REIT'
  | 'LAND_AGGREGATOR'
  | 'ADMIN' {
  const allowed = new Set([
    'DEVELOPER',
    'BROKER',
    'FAMILY_OFFICE',
    'HNI',
    'NBFC_FUND_REIT',
    'LAND_AGGREGATOR',
    'ADMIN',
  ]);
  if (allowed.has(role)) {
    return role as
      | 'DEVELOPER'
      | 'BROKER'
      | 'FAMILY_OFFICE'
      | 'HNI'
      | 'NBFC_FUND_REIT'
      | 'LAND_AGGREGATOR'
      | 'ADMIN';
  }
  return 'DEVELOPER';
}
