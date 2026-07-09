export type Role = 'DEVELOPER' | 'BROKER' | 'FAMILY_OFFICE' | 'HNI' | 'NBFC_FUND_REIT' | 'LAND_AGGREGATOR' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name?: string;
  companyName?: string;
  passwordHash?: string;
  role: Role;
  tier?: string;
  status?: 'active' | 'suspended' | 'pending';
  kycStatus?: 'not_submitted' | 'pending' | 'verified' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
  companyName?: string;
  mobile?: string;
  role: Role;
  pan?: string;
  gst?: string;
  reraNumber?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}
