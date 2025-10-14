import { NextRequest } from 'next/server';

// In your lib/cloudfront-auth.ts file

/**
 * Check if an email is whitelisted
 * Supports:
 * - Specific emails: "john@example.com"
 * - Full domains: "@example.com" or "example.com"
 * - Subdomains: "*.example.com" (matches any.subdomain.example.com)
 */
export function isEmailWhitelisted(email: string): boolean {
  const whitelistedDomains = process.env.AUTH_ALLOWED_EMAILS?.split(',').map(d => d.trim()) || [];
  
  if (whitelistedDomains.length === 0) {
    return false;
  }

  const emailLower = email.toLowerCase();
  const emailDomain = emailLower.split('@')[1];

  for (const entry of whitelistedDomains) {
    const entryLower = entry.toLowerCase();

    // Check for exact email match
    if (!entryLower.includes('*') && entryLower.includes('@')) {
      if (emailLower === entryLower) {
        return true;
      }
    }
    // Check for domain patterns
    else {
      // Remove @ prefix if present (e.g., "@example.com" -> "example.com")
      const domain = entryLower.startsWith('@') ? entryLower.slice(1) : entryLower;

      // Handle wildcard subdomains (e.g., "*.example.com")
      if (domain.startsWith('*.')) {
        const baseDomain = domain.slice(2); // Remove "*."
        if (emailDomain.endsWith(baseDomain) && emailDomain !== baseDomain) {
          return true;
        }
      }
      // Handle exact domain match (e.g., "example.com" or "@example.com")
      else {
        if (emailDomain === domain) {
          return true;
        }
      }
    }
  }

  return false;
}