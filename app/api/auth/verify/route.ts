import { NextRequest, NextResponse } from 'next/server';
import { verifyMagicLinkToken, generateSignedUrlParams } from '@/lib/cloudfront-auth';
import { BASE_URL } from '@/lib/helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(
        new URL(`${BASE_URL}/?error=missing_token`, request.url)
      );
    }

    const result = verifyMagicLinkToken(token);

    if (!result.valid || !result.email) {
      const errorMessage = result.error || 'invalid_token';
      return NextResponse.redirect(
        new URL(`${BASE_URL}/?error=${encodeURIComponent(errorMessage)}`, request.url)
      );
    }
    
    const discordWebhook = process.env.DISCORD_WEBHOOK_URL;
    // if (discordWebhook && result.email) {
    //   try {
    //     fetch(discordWebhook, {
    //       method: 'POST',
    //       headers: { 'Content-Type': 'application/json' },
    //       body: JSON.stringify({
    //         content: `✅ **User logged in** → \`${result.email}\` (${process.env.NEXT_PUBLIC_VERCEL_ENV || 'local'})`
    //       })
    //     }).catch(e => console.error('Discord webhook failed:', e));
    //   } catch (e) {
    //     console.error("Failed to send Discord login notification:", e);
    //   }
    // }

    const signedParams = generateSignedUrlParams(result.email);

    const response = NextResponse.redirect(
      new URL(
        `${BASE_URL}/?auth=success&cf_policy=${encodeURIComponent(signedParams.policy)}&cf_signature=${encodeURIComponent(signedParams.signature)}&cf_keypairid=${encodeURIComponent(signedParams.keyPairId)}&cf_expires=${signedParams.expiresAt}&email=${encodeURIComponent(result.email)}`,
        request.url
      )
    );

    return response;

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.redirect(
      new URL(`${BASE_URL}/?error=verification_failed`, request.url)
    );
  }
}