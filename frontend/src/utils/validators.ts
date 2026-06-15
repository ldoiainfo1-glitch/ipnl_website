// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone validation (10-digit Indian number)
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// PAN validation
export const isValidPAN = (pan: string): boolean => {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan.toUpperCase());
};

// GST validation
export const isValidGST = (gst: string): boolean => {
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstRegex.test(gst.toUpperCase());
};

// RERA validation (basic format check)
export const isValidRERA = (rera: string): boolean => {
  // RERA format varies by state, basic check for alphanumeric
  return /^[A-Z0-9]{10,}$/i.test(rera);
};

// Password strength validation
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// URL validation
export const isValidURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Ticket size validation
export const isValidTicketSize = (min: number, max?: number): boolean => {
  if (min <= 0) return false;
  if (max && max <= min) return false;
  return true;
};

// File size validation (in bytes)
export const isValidFileSize = (size: number, maxSizeMB = 10): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return size <= maxSizeBytes;
};

// File type validation
export const isValidFileType = (
  fileName: string,
  allowedTypes: string[]
): boolean => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  return extension ? allowedTypes.includes(extension) : false;
};
