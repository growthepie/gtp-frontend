"use server";
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // The logic for protecting routes has been moved to the client-side
  // in components/auth/ProtectedApp.tsx, which uses auth state from localStorage.
  // API routes are now protected directly by CloudFront, which validates
  // the signed URL parameters on each request.
  // This middleware is no longer responsible for authentication checks.

  // You can still use this middleware for other purposes like redirects,
  // geolocation, or modifying headers if needed.

  return NextResponse.next();
}