import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { hasValidAuth } from '@/lib/cloudfront-auth';

export async function middleware(request: NextRequest) {
  // Check if we're on a protected subdomain
  const protectedSubdomain = process.env.NEXT_PUBLIC_PROTECTED_SUBDOMAIN;

  if (!protectedSubdomain) {
    // No protection configured, allow all requests
    return NextResponse.next();
  }

  const hostname = request.headers.get('host') || '';
  const isProtectedDomain = hostname.includes(protectedSubdomain);

  if (!isProtectedDomain) {
    // Not on protected subdomain, allow request
    return NextResponse.next();
  }

  // Allow auth API routes
  if (request.nextUrl.pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  // Allow static assets and Next.js internals
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/static') ||
    request.nextUrl.pathname.includes('.') // files with extensions
  ) {
    return NextResponse.next();
  }

  // Check if user has valid auth
  const authenticated = await hasValidAuth(request);

  if (!authenticated) {
    // For API routes, return 401
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // For page routes, allow the root page (where auth UI is shown)
    if (request.nextUrl.pathname === '/') {
      return NextResponse.next();
    }

    // Redirect other pages to root for authentication
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};