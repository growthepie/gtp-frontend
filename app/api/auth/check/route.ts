import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const isAuthenticated = false;
    const cookieStore = cookies();
    const email = cookieStore.get('auth-email')?.value || null;

    return NextResponse.json({
      authenticated: isAuthenticated,
      email: isAuthenticated ? email : null
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { authenticated: false, email: null },
      { status: 500 }
    );
  }
}