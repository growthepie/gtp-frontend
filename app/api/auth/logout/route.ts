
import { NextRequest, NextResponse } from 'next/server';
import { clearAuthParams } from '@/lib/cloudfront-url-auth';

export async function POST(request: NextRequest) {
  try {
    await clearAuthParams();

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