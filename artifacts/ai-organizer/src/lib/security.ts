/**
 * Security utilities for XSS prevention and input sanitization
 */

// HTML entity encoding map
const htmlEntities: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(str: string): string {
  if (typeof str !== 'string') return '';
  return str.replace(/[&<>"'`=/]/g, char => htmlEntities[char] || char);
}

/**
 * Sanitize user input for safe display
 * Removes potential script tags and event handlers
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    // Remove script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove event handlers
    .replace(/\son\w+\s*=/gi, '')
    // Remove javascript: URLs
    .replace(/javascript:/gi, '')
    // Remove data: URLs (potential XSS vector)
    .replace(/data:/gi, '')
    // Remove vbscript: URLs
    .replace(/vbscript:/gi, '');
}

/**
 * Validate and sanitize URL to prevent javascript: and data: attacks
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') return '';
  
  const trimmed = url.trim().toLowerCase();
  
  // Block dangerous protocols
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('vbscript:')
  ) {
    return '';
  }
  
  // Allow http, https, mailto, tel, and relative URLs
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('#') ||
    !trimmed.includes(':')
  ) {
    return url;
  }
  
  return '';
}

/**
 * Generate a cryptographically secure random string
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * CSRF token management
 */
const CSRF_KEY = 'aiorg_csrf_token';

export function getCsrfToken(): string {
  let token = sessionStorage.getItem(CSRF_KEY);
  if (!token) {
    token = generateSecureToken();
    sessionStorage.setItem(CSRF_KEY, token);
  }
  return token;
}

export function validateCsrfToken(token: string): boolean {
  const storedToken = sessionStorage.getItem(CSRF_KEY);
  return storedToken !== null && storedToken === token;
}

/**
 * Content Security Policy helpers
 */
export function generateNonce(): string {
  return generateSecureToken(16);
}

/**
 * Rate limiting for client-side actions
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (entry.count >= maxRequests) {
    return false;
  }
  
  entry.count++;
  return true;
}

export default {
  escapeHtml,
  sanitizeInput,
  sanitizeUrl,
  generateSecureToken,
  getCsrfToken,
  validateCsrfToken,
  generateNonce,
  checkRateLimit,
};
