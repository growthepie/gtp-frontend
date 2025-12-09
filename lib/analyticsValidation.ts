// lib/analyticsValidation.ts
import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_PATTERNS = [
  'growthepie.com',      // exact match
  '*.growthepie.com',    // any subdomain
  'localhost:3000',
  'localhost:3001',
]

function matchesPattern(host: string, pattern: string): boolean {
  if (pattern.startsWith('*.')) {
    const baseDomain = pattern.slice(2)
    // Match subdomains OR the base domain itself
    return host === baseDomain || host.endsWith(`.${baseDomain}`)
  }
  return host === pattern
}

function isAllowedHost(host: string): boolean {
  return ALLOWED_PATTERNS.some(pattern => matchesPattern(host, pattern))
}

export function validateAnalyticsRequest(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')

  // Dev bypass: allow direct access in development or from localhost
  if (process.env.NODE_ENV === 'development') {
    const host = request.headers.get('host') || ''
    if (host.startsWith('local.growthepie.com:')) {
      return true
    }
  }

  try {
    // Check origin header (fetch, XHR, beacon)
    if (origin) {
      const { host } = new URL(origin)
      return isAllowedHost(host)
    }

    // Check referer (script tags, images)
    if (referer) {
      const { host } = new URL(referer)
      return isAllowedHost(host)
    }
  } catch {
    // Malformed URL
    return false
  }

  // Deny by default
  return false
}

export function withAnalyticsValidation(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    if (!validateAnalyticsRequest(request)) {
      // Return 204 for beacons (they ignore errors), 403 for scripts
      const isBeacon = request.url.includes('/p') || request.url.includes('collect')
      return new NextResponse(null, { status: isBeacon ? 204 : 403 })
    }
    return handler(request, ...args)
  }
}