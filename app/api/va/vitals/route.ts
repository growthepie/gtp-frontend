// app/api/va/vitals/route.ts
// Proxy for Vercel Analytics vitals endpoint
import { NextRequest, NextResponse } from 'next/server'
import { withAnalyticsValidation } from '@/lib/analyticsValidation'

const VERCEL_VITALS_URL = 'https://vitals.vercel-analytics.com/v1/vitals'

async function handlePost(request: NextRequest) {
  try {
    const body = await request.text()

    const response = await fetch(VERCEL_VITALS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': request.headers.get('content-type') || 'application/json',
        'User-Agent': request.headers.get('user-agent') || '',
      },
      body,
    })

    // Return 204 for successful beacon
    return new NextResponse(null, {
      status: response.ok ? 204 : response.status,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Vercel vitals proxy error:', error)
    return new NextResponse(null, { status: 204 })
  }
}

export const POST = withAnalyticsValidation(handlePost)

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export const runtime = 'edge'
