'use server';

import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import crypto from 'node:crypto';

// CloudFront cookie names
const COOKIE_NAMES = {
  POLICY: 'CloudFront-Policy',
  SIGNATURE: 'CloudFront-Signature',
  KEY_PAIR_ID: 'CloudFront-Key-Pair-Id'
};

// Cookie settings for secure cookies
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  // 7 days expiry for the auth cookies
  maxAge: 7 * 24 * 60 * 60
};

export interface CloudFrontPolicy {
  Statement: [{
    Resource: string;
    Condition: {
      DateLessThan: {
        'AWS:EpochTime': number;
      };
    };
  }];
}

/**
 * Creates a CloudFront signed cookie policy
 */
export function createPolicy(resource: string, expiryHours: number = 24): CloudFrontPolicy {
  const expiry = Math.floor(Date.now() / 1000) + (expiryHours * 60 * 60);

  return {
    Statement: [{
      Resource: resource,
      Condition: {
        DateLessThan: {
          'AWS:EpochTime': expiry
        }
      }
    }]
  };
}

/**
 * Signs a CloudFront policy with the private key
 */
export function signPolicy(policy: CloudFrontPolicy): {
  policy: string;
  signature: string;
  keyPairId: string;
} {
  const privateKey = process.env.CLOUDFRONT_PRIVATE_KEY;
  const keyPairId = process.env.CLOUDFRONT_KEY_PAIR_ID;

  if (!privateKey || !keyPairId) {
    throw new Error('CloudFront credentials not configured');
  }

  // Convert policy to base64
  const policyString = JSON.stringify(policy);
  const policyBase64 = Buffer.from(policyString)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/=/g, '_')
    .replace(/\//g, '~');

  // Create signature
  const sign = crypto.createSign('RSA-SHA1');
  sign.update(policyString);
  const signature = sign.sign(privateKey, 'base64')
    .replace(/\+/g, '-')
    .replace(/=/g, '_')
    .replace(/\//g, '~');

  return {
    policy: policyBase64,
    signature,
    keyPairId
  };
}

/**
 * Sets CloudFront signed cookies for authenticated access
 */
export async function setAuthCookies(email: string) {
  const cookieStore = cookies();
  const domain = process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN || '*';

  // Create policy for all resources under the domain
  const policy = createPolicy(`https://${domain}/*`, 24 * 7); // 7 days
  const signed = signPolicy(policy);

  // Set the three required CloudFront cookies
  cookieStore.set(COOKIE_NAMES.POLICY, signed.policy, COOKIE_OPTIONS);
  cookieStore.set(COOKIE_NAMES.SIGNATURE, signed.signature, COOKIE_OPTIONS);
  cookieStore.set(COOKIE_NAMES.KEY_PAIR_ID, signed.keyPairId, COOKIE_OPTIONS);

  // Also set a session cookie with user email
  cookieStore.set('auth-email', email, {
    ...COOKIE_OPTIONS,
    httpOnly: false // Allow client to read this one
  });
}

/**
 * Checks if the current request has valid CloudFront auth cookies
 */
export async function hasValidAuth(request?: NextRequest): Promise<boolean> {
  const cookieStore = request ? request.cookies : cookies();

  const hasPolicy = cookieStore.has(COOKIE_NAMES.POLICY);
  const hasSignature = cookieStore.has(COOKIE_NAMES.SIGNATURE);
  const hasKeyPairId = cookieStore.has(COOKIE_NAMES.KEY_PAIR_ID);

  return hasPolicy && hasSignature && hasKeyPairId;
}

/**
 * Clears all auth cookies
 */
export async function clearAuthCookies() {
  const cookieStore = cookies();

  cookieStore.delete(COOKIE_NAMES.POLICY);
  cookieStore.delete(COOKIE_NAMES.SIGNATURE);
  cookieStore.delete(COOKIE_NAMES.KEY_PAIR_ID);
  cookieStore.delete('auth-email');
}

/**
 * Validates if an email domain is whitelisted
 */
export function isEmailWhitelisted(email: string): boolean {
  const whitelistedDomains = (process.env.WHITELISTED_DOMAINS || '')
    .split(',')
    .map(d => d.trim())
    .filter(Boolean);

  // If no domains configured, allow all (for dev)
  if (whitelistedDomains.length === 0) {
    return true;
  }

  const emailDomain = email.split('@')[1]?.toLowerCase();
  return whitelistedDomains.some(domain =>
    emailDomain === domain.toLowerCase()
  );
}

/**
 * Generates a secure token for magic links
 */
export function generateMagicLinkToken(email: string): string {
  const secret = process.env.MAGIC_LINK_SECRET;
  if (!secret) {
    throw new Error('Magic link secret not configured');
  }

  const expires = Date.now() + (15 * 60 * 1000); // 15 minutes
  const payload = `${email}:${expires}`;

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const signature = hmac.digest('hex');

  return Buffer.from(`${payload}:${signature}`).toString('base64url');
}

/**
 * Verifies a magic link token
 */
export function verifyMagicLinkToken(token: string): {
  valid: boolean;
  email?: string;
  error?: string;
} {
  const secret = process.env.MAGIC_LINK_SECRET;
  if (!secret) {
    return { valid: false, error: 'Magic link secret not configured' };
  }

  try {
    const decoded = Buffer.from(token, 'base64url').toString();
    const [email, expires, signature] = decoded.split(':');

    if (!email || !expires || !signature) {
      return { valid: false, error: 'Invalid token format' };
    }

    // Check expiry
    if (Date.now() > parseInt(expires)) {
      return { valid: false, error: 'Token expired' };
    }

    // Verify signature
    const payload = `${email}:${expires}`;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');

    if (signature !== expectedSignature) {
      return { valid: false, error: 'Invalid signature' };
    }

    return { valid: true, email };
  } catch (error) {
    return { valid: false, error: 'Token decode error' };
  }
}