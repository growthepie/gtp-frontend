// app/va/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withAnalyticsValidation } from '@/lib/analyticsValidation'

const ENDPOINT_MAP: Record<string, string> = {
  'event': 'https://va.vercel-scripts.com/v1/event',
  'vitals': 'https://vitals.vercel-analytics.com/v1/vitals',
}

async function handleRequest(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/')
  const targetUrl = ENDPOINT_MAP[path]

  if (!targetUrl) {
    return new NextResponse(null, { status: 404 })
  }

  try {
    // Extract client IP (same pattern as your GA proxy)
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || ''

    const body = request.method === 'POST' ? await request.text() : undefined

    await fetch(targetUrl, {
      method: request.method,
      headers: {
        'Content-Type': request.headers.get('content-type') || 'application/json',
        'User-Agent': request.headers.get('user-agent') || '',
        ...(clientIp && { 
          'X-Forwarded-For': clientIp,
          'x-vercel-ip': clientIp,
        }),
      },
      ...(body && { body }),
    })

    return new NextResponse(null, {
      status: 204,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    // Safe error logging - no PII
    console.error('VA proxy error:', error instanceof Error ? error.message : 'Unknown error')
    return new NextResponse(null, { status: 204 })
  }
}

export const GET = withAnalyticsValidation(handleRequest)
export const POST = withAnalyticsValidation(handleRequest)

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export const runtime = 'edge'