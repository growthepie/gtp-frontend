import { NextRequest, NextResponse } from 'next/server';
import { verifyMagicLinkToken, setAuthCookies } from '@/lib/cloudfront-auth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(
        new URL('/?error=missing_token', request.url)
      );
    }

    // Verify the magic link token
    const result = verifyMagicLinkToken(token);

    if (!result.valid || !result.email) {
      const errorMessage = result.error || 'invalid_token';
      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent(errorMessage)}`, request.url)
      );
    }

    // Set CloudFront signed cookies
    await setAuthCookies(result.email);

    // Redirect to the app with success message
    const response = NextResponse.redirect(
      new URL('/?auth=success', request.url)
    );

    // Also set a client-readable cookie for the UI
    response.cookies.set('auth-email', result.email, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return response;

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.redirect(
      new URL('/?error=verification_failed', request.url)
    );
  }
}