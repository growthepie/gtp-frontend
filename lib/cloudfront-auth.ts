import { NextRequest } from 'next/server';
import crypto from 'crypto';

// Re-export edge-compatible functions
export { isEmailWhitelisted } from './cloudfront-auth-edge';

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
 * Formats a private key string by ensuring proper newlines
 */
function formatPrivateKey(keyString: string): string {
  if (keyString.includes('\n')) {
    return keyString;
  }
  let key = keyString
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\\n/g, '')
    .replace(/\s/g, '');
  const formattedKey = key.match(/.{1,64}/g)?.join('\n') || key;
  return `-----BEGIN PRIVATE KEY-----\n${formattedKey}\n-----END PRIVATE KEY-----`;
}

/**
 * Creates a CloudFront signed policy
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
  const privateKeyRaw = process.env.AUTH_CLOUDFRONT_PRIVATE_KEY;
  const keyPairId = process.env.AUTH_CLOUDFRONT_KEY_PAIR_ID;

  if (!privateKeyRaw || !keyPairId) {
    throw new Error('CloudFront credentials not configured');
  }

  const privateKey = formatPrivateKey(privateKeyRaw);
  const policyString = JSON.stringify(policy);
  const policyBase64 = Buffer.from(policyString)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/=/g, '_')
    .replace(/\//g, '~');

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
 * Generates a secure token for magic links
 */
export function generateMagicLinkToken(email: string): string {
  const secret = process.env.AUTH_SECRET;
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
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return { valid: false, error: 'Magic link secret not configured' };
  }
  try {
    const decoded = Buffer.from(token, 'base64url').toString();
    const [email, expires, signature] = decoded.split(':');
    if (!email || !expires || !signature) {
      return { valid: false, error: 'Invalid token format' };
    }
    if (Date.now() > parseInt(expires)) {
      return { valid: false, error: 'Token expired' };
    }
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

/**
 * Generates CloudFront signed URL parameters
 */
export function generateSignedUrlParams(email: string): {
  policy: string;
  signature: string;
  keyPairId: string;
  expiresAt: number;
} {
  const cloudfrontDomain = process.env.NEXT_PUBLIC_API_DOMAIN || 'api.growthepie.com';
  const policy = createPolicy(`https://${cloudfrontDomain}/*`, 24 * 7); // 7 days
  const signed = signPolicy(policy);
  const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000);
  return {
    policy: signed.policy,
    signature: signed.signature,
    keyPairId: signed.keyPairId,
    expiresAt
  };
}
