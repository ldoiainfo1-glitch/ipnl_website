export type Role = 'user' | 'admin';

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
}

export interface LoginRequest {
  email: string;
  password: string;
}
