// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPESCRIPT TYPES FOR INDIA PROPERTY NETWORKS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ========== ENUMS ==========

export enum UserTier {
  OBSERVER = 'OBSERVER',
  VERIFIED = 'VERIFIED',
  ENTERPRISE = 'ENTERPRISE',
}

export enum UserRole {
  DEVELOPER = 'DEVELOPER',
  BROKER = 'BROKER',
  FAMILY_OFFICE = 'FAMILY_OFFICE',
  HNI = 'HNI',
  NBFC_FUND_REIT = 'NBFC_FUND_REIT',
  LAND_AGGREGATOR = 'LAND_AGGREGATOR',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

export enum KycStatus {
  NOT_SUBMITTED = 'NOT_SUBMITTED',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum MandateType {
  BUY = 'BUY',
  SELL = 'SELL',
}

export enum MandateStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  EXPIRED = 'EXPIRED',
}

export enum AssetClass {
  RESIDENTIAL = 'RESIDENTIAL',
  COMMERCIAL = 'COMMERCIAL',
  INDUSTRIAL = 'INDUSTRIAL',
  HOSPITALITY = 'HOSPITALITY',
  RETAIL = 'RETAIL',
  LAND = 'LAND',
  MIXED_USE = 'MIXED_USE',
}

export enum PropertyType {
  // Land types
  RESIDENTIAL_LAND = 'RESIDENTIAL_LAND',
  COMMERCIAL_LAND = 'COMMERCIAL_LAND',
  INDUSTRIAL_LAND = 'INDUSTRIAL_LAND',
  // Residential types
  PREMIUM_RESIDENTIAL = 'PREMIUM_RESIDENTIAL',
  PLOTTED_DEVELOPMENT = 'PLOTTED_DEVELOPMENT',
  SOCIETY_REDEVELOPMENT = 'SOCIETY_REDEVELOPMENT',
  // Commercial types
  GRADE_A_OFFICE = 'GRADE_A_OFFICE',
  RETAIL_MALL = 'RETAIL_MALL',
  // Industrial types
  WAREHOUSING_LOGISTICS = 'WAREHOUSING_LOGISTICS',
  DATA_CENTRES = 'DATA_CENTRES',
  // Hospitality types
  HOSPITALITY_RESORTS = 'HOSPITALITY_RESORTS',
  // Mixed Use types
  MIXED_USE_TOWNSHIPS = 'MIXED_USE_TOWNSHIPS',
}

export enum IntroStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED',
}

export enum MessageStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
}

export enum NotificationType {
  INTRO_RECEIVED = 'INTRO_RECEIVED',
  INTRO_ACCEPTED = 'INTRO_ACCEPTED',
  INTRO_DECLINED = 'INTRO_DECLINED',
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',
  MANDATE_UPDATED = 'MANDATE_UPDATED',
  KYC_APPROVED = 'KYC_APPROVED',
  KYC_REJECTED = 'KYC_REJECTED',
  TIER_UPGRADED = 'TIER_UPGRADED',
}

// ========== CORE MODELS ==========

export interface User {
  id: string;
  email: string;
  mobile: string;
  companyName: string;
  role: UserRole;
  tier: UserTier;
  status: UserStatus;
  kycStatus: KycStatus;
  
  // Optional Profile Fields
  pan?: string;
  gst?: string;
  reraNumber?: string;
  companyDescription?: string;
  website?: string;
  linkedin?: string;
  logo?: string;
  city?: string;
  state?: string;
  assetPreferences?: PropertyType[];
  ticketSizeMin?: number;
  ticketSizeMax?: number;
  
  // Reputation & Metrics
  reputationScore: number;
  totalIntrosSent: number;
  totalIntrosReceived: number;
  totalMandatesPosted: number;
  
  // Quota Management
  introQuotaLimit: number;
  introQuotaUsed: number;
  billingAnniversary?: Date;
  
  // Metadata
  isAnonymous: boolean; // For OBSERVER tier
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface Mandate {
  id: string;
  userId: string;
  user?: User;
  
  type: MandateType;
  status: MandateStatus;
  title: string;
  description: string;
  
  // Location
  city: string;
  state: string;
  locality?: string;
  
  // Asset Details
  assetClass: AssetClass;
  propertyType?: PropertyType;
  builtUpArea?: number;
  plotArea?: number;
  
  // Financial
  ticketSize: number; // in INR
  ticketSizeMax?: number;
  
  // Additional Filters
  tags: string[];
  
  // Visibility
  isOffMarket: boolean;
  expiresAt?: Date;
  
  // Metrics
  viewCount: number;
  introCount: number;
  
  createdAt: Date;
  updatedAt: Date;

  // Admin moderation metadata
  ownerKycStatus?: KycStatus;
  moderationStatus?: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  moderationNote?: string;
  moderationReviewedBy?: string;
  moderationReviewedAt?: Date;
}

export interface Introduction {
  id: string;
  mandateId: string;
  mandate?: Mandate;
  
  senderId: string;
  sender?: User;
  
  receiverId: string;
  receiver?: User;
  
  status: IntroStatus;
  message?: string;
  
  // Admin concierge note (for ENTERPRISE tier)
  conciergeNote?: string;
  
  expiresAt: Date;
  respondedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  id: string;
  participants: User[];
  participantIds: string[];
  
  lastMessage?: Message;
  unreadCount: number;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender?: User;
  
  content: string;
  status: MessageStatus;
  
  // For file attachments (future)
  attachments?: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  
  type: NotificationType;
  title: string;
  message: string;
  
  // Link to related entity
  relatedEntityId?: string;
  relatedEntityType?: string;
  
  isRead: boolean;
  readAt?: Date;
  
  createdAt: Date;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  user: User;
  
  totalIntros: number;
  successfulIntros: number;
  mandatesPosted: number;
  reputationScore: number;
  averageRating: number;
  reviewCount: number;
  scoreBreakdown: {
    verification: number;
    reviews: number;
    activity: number;
  };
}

export interface ReputationReview {
  id: string;
  reviewerId: string;
  revieweeId: string;
  mandateId?: string;
  rating: number;
  comment?: string;
  status: 'PUBLISHED' | 'HIDDEN';
  reviewer?: User;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReputationStats {
  reputationScore: number;
  averageRating: number;
  reviewCount: number;
  approvedMandates: number;
  scoreBreakdown: {
    verification: number;
    reviews: number;
    activity: number;
  };
}

export interface KycDocument {
  id: string;
  userId: string;
  user?: User;
  
  panCard?: string;
  gstCertificate?: string;
  reraCertificate?: string;
  incorporationCertificate?: string;
  addressProof?: string;
  
  status: KycStatus;
  reviewedBy?: string;
  reviewedAt?: Date;
  rejectionReason?: string;
  reviewNote?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditEvent {
  id: string;
  adminId: string;
  admin?: User;
  targetUser?: User;
  targetCompanyName?: string;
  targetEmail?: string;
  targetMandateTitle?: string;
  
  action: string;
  entityType: string;
  entityId: string;
  note?: string;
  changes?: Record<string, unknown>;
  
  createdAt: Date;
}

// ========== API RESPONSE TYPES ==========

export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
  error?: ApiError;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
}

// ========== REQUEST TYPES ==========

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  mobile: string;
  companyName: string;
  role: UserRole;
  pan?: string;
  gst?: string;
  reraNumber?: string;
}

export interface CreateMandateRequest {
  type: MandateType;
  title: string;
  description: string;
  city: string;
  state: string;
  locality?: string;
  propertyType: PropertyType;
  builtUpArea?: number;
  plotArea?: number;
  ticketSize: number;
  ticketSizeMax?: number;
  tags: string[];
  isOffMarket: boolean;
}

export interface SendIntroRequest {
  mandateId: string;
  receiverId: string;
  message?: string;
}

export interface SendMessageRequest {
  conversationId?: string;
  recipientId?: string;
  content: string;
}

export interface UpdateKycStatusRequest {
  userId: string;
  status: KycStatus;
  rejectionReason?: string;
  reviewNote?: string;
}

export interface SubmitKycRequest {
  panCard?: File;
  gstCertificate?: File;
  reraCertificate?: File;
  incorporationCertificate?: File;
  addressProof?: File;
}

export interface UpdateProfileRequest {
  companyName?: string;
  mobile?: string;
  companyDescription?: string;
  website?: string;
  linkedin?: string;
  city?: string;
  state?: string;
  assetPreferences?: PropertyType[];
  ticketSizeMin?: number;
  ticketSizeMax?: number;
}

export interface UpdateLogoRequest {
  logo: File;
}

// ========== FILTER TYPES ==========

export interface MemberFilters {
  role?: UserRole;
  city?: string;
  assetClass?: PropertyType;
  ticketSizeMin?: number;
  ticketSizeMax?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface MemberProfileResponse {
  user: User;
  mandates: Mandate[];
}

export interface MandateFilters {
  type?: MandateType;
  assetClass?: AssetClass;
  city?: string;
  state?: string;
  minTicketSize?: number;
  maxTicketSize?: number;
  tags?: string[];
  sortBy?: 'createdAt' | 'ticketSize' | 'viewCount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface UserFilters {
  role?: UserRole;
  tier?: UserTier;
  status?: UserStatus;
  kycStatus?: KycStatus;
  city?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ========== UTILITY TYPES ==========

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  demoLogin: () => Promise<void>;
}

export interface SocketMessage {
  event: string;
  data: unknown;
}

export interface DashboardStats {
  totalMandates: number;
  totalUsers: number;
  totalIntros: number;
  pendingKycCount: number;
  activeSubscribers: number;
  revenueThisMonth: number;
}

export interface UserStats {
  mandatesPosted: number;
  mandatesActive: number;
  introsSent: number;
  introsReceived: number;
  conversationsActive: number;
  quotaRemaining: number;
}
