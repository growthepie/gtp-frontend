'use client';

const STORAGE_KEYS = {
  POLICY: 'cf_policy',
  SIGNATURE: 'cf_signature',
  KEY_PAIR_ID: 'cf_keypairid',
  EXPIRES: 'cf_expires',
  EMAIL: 'auth_email'
};

/**
 * Store CloudFront auth parameters in localStorage
 */
export function storeAuthParams(params: {
  policy: string;
  signature: string;
  keyPairId: string;
  expiresAt: number;
  email: string;
}) {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(STORAGE_KEYS.POLICY, params.policy);
  localStorage.setItem(STORAGE_KEYS.SIGNATURE, params.signature);
  localStorage.setItem(STORAGE_KEYS.KEY_PAIR_ID, params.keyPairId);
  localStorage.setItem(STORAGE_KEYS.EXPIRES, params.expiresAt.toString());
  localStorage.setItem(STORAGE_KEYS.EMAIL, params.email);
}

/**
 * Get stored auth parameters
 */
export function getAuthParams(): {
  policy: string;
  signature: string;
  keyPairId: string;
} | null {
  if (typeof window === 'undefined') return null;
  
  const policy = localStorage.getItem(STORAGE_KEYS.POLICY);
  const signature = localStorage.getItem(STORAGE_KEYS.SIGNATURE);
  const keyPairId = localStorage.getItem(STORAGE_KEYS.KEY_PAIR_ID);
  const expires = localStorage.getItem(STORAGE_KEYS.EXPIRES);
  
  // Check if expired
  if (expires && Date.now() > parseInt(expires)) {
    clearAuthParams();
    return null;
  }
  
  if (!policy || !signature || !keyPairId) return null;
  
  return { policy, signature, keyPairId };
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getAuthParams() !== null;
}

/**
 * Get authenticated user email
 */
export function getAuthEmail(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.EMAIL);
}

/**
 * Clear auth parameters
 */
export function clearAuthParams() {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(STORAGE_KEYS.POLICY);
  localStorage.removeItem(STORAGE_KEYS.SIGNATURE);
  localStorage.removeItem(STORAGE_KEYS.KEY_PAIR_ID);
  localStorage.removeItem(STORAGE_KEYS.EXPIRES);
  localStorage.removeItem(STORAGE_KEYS.EMAIL);
}

/**
 * Add CloudFront auth parameters to URL
 */
export function addAuthToUrl(url: string): string {
  const params = getAuthParams();
  if (!params) return url;
  
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}Policy=${encodeURIComponent(params.policy)}&Signature=${encodeURIComponent(params.signature)}&Key-Pair-Id=${encodeURIComponent(params.keyPairId)}`;
}