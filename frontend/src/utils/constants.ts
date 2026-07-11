import { UserRole, MandateType, PropertyType, PartnerCategory } from '@/types';

// App constants
export const APP_NAME = 'India Property Network Ltd.';
export const APP_ABBREVIATION = 'India Property Network Ltd.';
export const APP_TAGLINE = 'The Exclusive Verified Network for India\'s Real Estate Deal Economy';

// Tier pricing (in INR)
export const TIER_PRICING = {
  OBSERVER: 0,
  VERIFIED: 24000,
  ENTERPRISE: null, // Custom pricing
} as const;

// Tier features
export const TIER_FEATURES = {
  OBSERVER: {
    name: 'Observer',
    price: 'Free',
    features: [
      'Browse mandates',
      'View profiles',
      'No introductions',
      'Anonymous profile',
      'Read-only access',
    ],
    introLimit: 0,
  },
  VERIFIED: {
    name: 'Verified',
    price: '₹24,000/year',
    features: [
      'Full KYC verification',
      '10 introductions/month',
      'Direct messaging',
      'Verified badge',
      'Profile visibility',
      'Off-market access',
    ],
    introLimit: 10,
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 'Custom',
    features: [
      'Unlimited introductions',
      'Team seats',
      'Mandate concierge',
      'Priority support',
      'Custom integrations',
      'Dedicated account manager',
    ],
    introLimit: -1, // Unlimited
  },
} as const;

// User roles display
export const USER_ROLES = [
  { value: UserRole.DEVELOPER, label: 'Developer' },
  { value: UserRole.BROKER, label: 'Broker / Channel Partner' },
  { value: UserRole.FAMILY_OFFICE, label: 'Family Office' },
  { value: UserRole.HNI, label: 'HNI / Individual Investor' },
  { value: UserRole.NBFC_FUND_REIT, label: 'NBFC / Fund / REIT' },
  { value: UserRole.LAND_AGGREGATOR, label: 'Land Aggregator' },
] as const;

// Asset classes - Property Types
export const ASSET_CLASSES = [
  { value: PropertyType.RESIDENTIAL_LAND, label: 'Residential Land' },
  { value: PropertyType.COMMERCIAL_LAND, label: 'Commercial Land' },
  { value: PropertyType.INDUSTRIAL_LAND, label: 'Industrial Land' },
  { value: PropertyType.SOCIETY_REDEVELOPMENT, label: 'Society Redevelopment' },
  { value: PropertyType.GRADE_A_OFFICE, label: 'Grade-A Office' },
  { value: PropertyType.WAREHOUSING_LOGISTICS, label: 'Warehousing & Logistics' },
  { value: PropertyType.DATA_CENTRES, label: 'Data Centres' },
  { value: PropertyType.HOSPITALITY_RESORTS, label: 'Hospitality & Resorts' },
  { value: PropertyType.RETAIL_MALL, label: 'Retail / Mall' },
  { value: PropertyType.MIXED_USE_TOWNSHIPS, label: 'Mixed-use Townships' },
  { value: PropertyType.PREMIUM_RESIDENTIAL, label: 'Premium Residential' },
  { value: PropertyType.PLOTTED_DEVELOPMENT, label: 'Plotted Development' },
] as const;

// Mandate types
export const MANDATE_TYPES = [
  { value: MandateType.BUY, label: 'Buy', color: 'text-green-500' },
  { value: MandateType.SELL, label: 'Sell', color: 'text-amber-500' },
] as const;

// Indian cities (major real estate markets)
export const INDIAN_CITIES = [
  'Mumbai',
  'Delhi',
  'Bangalore',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Pune',
  'Ahmedabad',
  'Gurgaon',
  'Noida',
  'Ghaziabad',
  'Faridabad',
  'Navi Mumbai',
  'Thane',
  'Surat',
  'Jaipur',
  'Lucknow',
  'Chandigarh',
  'Kochi',
  'Indore',
] as const;

// Indian states
export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi',
] as const;

export const PARTNER_CATEGORIES: { value: PartnerCategory; label: string }[] = [
  { value: PartnerCategory.DEVELOPERS_BUILDERS, label: 'Developers / Builders' },
  { value: PartnerCategory.BROKERS_CHANNEL_PARTNERS, label: 'Brokers & Channel Partners' },
  { value: PartnerCategory.INVESTORS_HNI_FAMILY_OFFICES, label: 'Investors / HNIs / Family Offices & Institutions' },
  { value: PartnerCategory.LANDOWNERS, label: 'Landowners' },
  { value: PartnerCategory.SOCIETY_REDEVELOPMENT_COMMITTEES, label: 'Society Redevelopment Committees' },
  { value: PartnerCategory.FINANCIAL_INSTITUTIONS_LENDERS, label: 'Financial Institutions & Lenders' },
  { value: PartnerCategory.INSTITUTIONAL_CORPORATE_PARTNERS, label: 'Institutional & Corporate Partners (REITs, Asset Managers, Hospitality)' },
  { value: PartnerCategory.ARCHITECTS_DESIGNERS, label: 'Architects & Designers' },
  { value: PartnerCategory.PMC_CONSULTANTS, label: 'PMC & Consultants' },
  { value: PartnerCategory.CONSTRUCTION_CONTRACTORS, label: 'Construction Contractors' },
  { value: PartnerCategory.TECHNICAL_SURVEY_EXPERTS, label: 'Technical & Survey Experts' },
  { value: PartnerCategory.LEGAL_COMPLIANCE_PROFESSIONALS, label: 'Legal & Compliance Professionals' },
  { value: PartnerCategory.VENDORS_SUPPLIERS, label: 'Vendors & Suppliers' },
  { value: PartnerCategory.MARKETING_SALES_PARTNERS, label: 'Marketing & Sales Partners' },
  { value: PartnerCategory.TECHNOLOGY_PARTNERS, label: 'Technology Partners' },
];

// Ticket size ranges (in INR)
export const TICKET_SIZE_RANGES = [
  { value: '0-10000000', label: 'Up to ₹1 Cr' },
  { value: '10000000-50000000', label: '₹1-5 Cr' },
  { value: '50000000-100000000', label: '₹5-10 Cr' },
  { value: '100000000-500000000', label: '₹10-50 Cr' },
  { value: '500000000-1000000000', label: '₹50-100 Cr' },
  { value: '1000000000-', label: '₹100 Cr+' },
] as const;

// Sort options
export const SORT_OPTIONS = [
  { value: 'createdAt-desc', label: 'Newest First' },
  { value: 'createdAt-asc', label: 'Oldest First' },
  { value: 'ticketSize-desc', label: 'Highest Value' },
  { value: 'ticketSize-asc', label: 'Lowest Value' },
  { value: 'viewCount-desc', label: 'Most Viewed' },
] as const;

// Notification settings
export const NOTIFICATION_TYPES = [
  { type: 'INTRO_RECEIVED', label: 'Introduction Received', enabled: true },
  { type: 'INTRO_ACCEPTED', label: 'Introduction Accepted', enabled: true },
  { type: 'INTRO_DECLINED', label: 'Introduction Declined', enabled: true },
  { type: 'MESSAGE_RECEIVED', label: 'New Message', enabled: true },
  { type: 'MANDATE_UPDATED', label: 'Mandate Updated', enabled: true },
  { type: 'KYC_APPROVED', label: 'KYC Approved', enabled: true },
  { type: 'KYC_REJECTED', label: 'KYC Rejected', enabled: true },
] as const;

// File upload limits
export const FILE_UPLOAD = {
  MAX_SIZE_MB: 10,
  ALLOWED_TYPES: ['pdf', 'jpg', 'jpeg', 'png'],
  ALLOWED_MIME_TYPES: ['application/pdf', 'image/jpeg', 'image/png'],
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// API timeouts
export const API_TIMEOUT = 30000; // 30 seconds

// Socket.io events
export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  MESSAGE_NEW: 'message:new',
  NOTIFICATION_NEW: 'notification:new',
  INTRO_RECEIVED: 'intro:received',
  INTRO_RESPONDED: 'intro:responded',
  MANDATE_UPDATED: 'mandate:updated',
} as const;
