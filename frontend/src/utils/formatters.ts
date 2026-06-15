import { format, formatDistanceToNow } from 'date-fns';

// Format currency in INR
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format large numbers with Indian numbering system (Lakhs, Crores)
export const formatIndianNumber = (num: number): string => {
  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)} Cr`;
  } else if (num >= 100000) {
    return `₹${(num / 100000).toFixed(2)} L`;
  } else if (num >= 1000) {
    return `₹${(num / 1000).toFixed(2)} K`;
  }
  return `₹${num.toLocaleString('en-IN')}`;
};

// Format date
export const formatDate = (date: Date | string): string => {
  return format(new Date(date), 'dd MMM yyyy');
};

// Format date with time
export const formatDateTime = (date: Date | string): string => {
  return format(new Date(date), 'dd MMM yyyy, hh:mm a');
};

// Relative time (e.g., "2 hours ago")
export const formatRelativeTime = (date: Date | string): string => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

// Format area
export const formatArea = (area: number, unit: 'sqft' | 'sqm' = 'sqft'): string => {
  return `${area.toLocaleString('en-IN')} ${unit}`;
};

// Format phone number
export const formatPhoneNumber = (phone: string): string => {
  // Assuming 10-digit Indian phone number
  if (phone.length === 10) {
    return `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;
  }
  return phone;
};

// Truncate text
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

// Format user role for display
export const formatUserRole = (role: string): string => {
  return role
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
};

// Format mandate type
export const formatMandateType = (type: string): string => {
  return type.charAt(0) + type.slice(1).toLowerCase();
};

// Get initials from name
export const getInitials = (name: string): string => {
  const words = name.split(' ');
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

// Format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
