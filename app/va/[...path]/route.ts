// app/va/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withAnalyticsValidation } from '@/lib/analyticsValidation'

// Map custom paths to Vercel's internal /_vercel/insights/* paths
// Vercel's infrastructure handles these automatically when deployed on Vercel
const PATH_MAP: Record<string, string> = {
  'event': '/_vercel/insights/event',
  'view': '/_vercel/insights/view',
  'session': '/_vercel/insights/session',
  'vitals': '/_vercel/speed-insights/vitals',
}

async function handleRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathParts } = await params
  const path = pathParts.join('/')
  const targetPath = PATH_MAP[path]

  if (!targetPath) {
    return new NextResponse(null, { status: 404 })
  }

  try {
    // Build the full URL to the same domain's /_vercel/insights/* path
    const host = request.headers.get('host') || ''
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const targetUrl = `${protocol}://${host}${targetPath}`

    // Extract client IP
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