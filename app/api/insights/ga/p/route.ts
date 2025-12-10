// app/api/insights/ga/p/route.ts
// Obfuscated GA4 collect endpoint proxy (via transport_url path)
import { NextRequest, NextResponse } from 'next/server'
import { withAnalyticsValidation } from '@/lib/analyticsValidation'

const GA_COLLECT_URL = 'https://www.google-analytics.com/g/collect'

const PARAM_DECODE_MAP: Record<string, string> = {
  '_d': 'tid',
  '_v': 'v',
  '_x': 'cid',
  '_z': 'sid',
  '_g': 'gtm',
  '_c': 'cx',
}

function decodeParams(searchParams: URLSearchParams): URLSearchParams {
  const decoded = new URLSearchParams()
  
  searchParams.forEach((value, key) => {
    const originalKey = PARAM_DECODE_MAP[key] || key
    decoded.set(originalKey, value)
  })
  
  return decoded
}

async function handleCollect(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const decodedParams = decodeParams(searchParams)

    // Get address for geo accuracy
    const address = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || ''

    // Add uip param for GA4 IP override (more reliable than X-Forwarded-For for GA)
    if (address && !decodedParams.has('uip')) {
      decodedParams.set('uip', address)
    }

    const queryString = decodedParams.toString()
    const targetUrl = queryString ? `${GA_COLLECT_URL}?${queryString}` : GA_COLLECT_URL

    const options: RequestInit = {
      method: request.method,
      headers: {
        'User-Agent': request.headers.get('user-agent') || '',
        'Content-Type': request.headers.get('content-type') || 'application/x-www-form-urlencoded',
        // Also forward address via header as backup
        ...(address && { 'X-Forwarded-For': address }),
      },
    }

    if (request.method === 'POST') {
      const body = await request.text()
      if (body) {
        options.body = body
      }
    }

    await fetch(targetUrl, options)

    // Return 204 for beacon
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    // Avoid logging anything that could contain PII
    console.error('GA collect proxy error:', error instanceof Error ? error.message : 'Unknown error')
    return new NextResponse(null, { status: 204 })
  }
}

export const GET = withAnalyticsValidation(handleCollect)
export const POST = withAnalyticsValidation(handleCollect)

// Handle preflight requests
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
