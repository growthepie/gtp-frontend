import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookies } from '@/lib/cloudfront-auth';

export async function POST(request: NextRequest) {
  try {
    await clearAuthCookies();

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}