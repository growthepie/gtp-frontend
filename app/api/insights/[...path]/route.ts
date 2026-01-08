// app/api/insights/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { resolveProxyDomain, rewriteScriptContent } from '@/lib/analyticsConfig'
import { withAnalyticsValidation } from '@/lib/analyticsValidation'

const CLARITY_BEACON_DOMAINS = ['a.clarity.ms', 'k.clarity.ms', 'j.clarity.ms']

async function handleGet(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return proxyRequest(request, path)
}

async function handlePost(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return proxyRequest(request, path)
}

export const GET = withAnalyticsValidation(handleGet)
export const POST = withAnalyticsValidation(handlePost)

async function proxyRequest(request: NextRequest, pathParts: string[]) {
  const path = pathParts.join('/')
  const { searchParams } = new URL(request.url)

  // Use the helper to resolve domain from path
  const { domain: targetDomain, targetPath } = resolveProxyDomain(path)

  // Get address for geo accuracy
  const address = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || ''

  // Build target URL
  let targetUrl = new URL(`https://${targetDomain}/${targetPath}`)
  
  // Copy over search params
  searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value)
  })

  // Geo hint for regional accuracy
  const isCollect = targetDomain.includes('google-analytics') && targetPath.includes('collect')
  if (isCollect && address && !targetUrl.searchParams.has('_uip')) {
    const geo = address.includes('.') ? address.replace(/\.\d+$/, '.0') : address
    targetUrl.searchParams.set('_uip', geo)
  }

  try {
    const options: RequestInit = {
      method: request.method,
      headers: {
        'User-Agent': request.headers.get('user-agent') || '',
        'Content-Type': request.headers.get('content-type') || 'application/x-www-form-urlencoded',
        // Forward address for geolocation accuracy
        ...(address && { 'X-Forwarded-For': address }),
      },
    }

    // Forward body for POST requests
    if (request.method === 'POST') {
      const body = await request.text()
      if (body) {
        options.body = body
      }
    }

    const response = await fetch(targetUrl.toString(), options)

    // For tracking beacons (collect endpoints), return minimal response
    const isBeacon = path.includes('collect') || CLARITY_BEACON_DOMAINS.some(d => targetDomain === d)

    if (isBeacon) {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    // For scripts, get content and rewrite URLs
    const contentType = response.headers.get('content-type') || 'text/plain'

    if (contentType.includes('javascript') || contentType.includes('text/html')) {
      let content = await response.text()
      const host = request.headers.get('host') || 'localhost:3000'

      // Apply URL rewrites (pass targetDomain for domain-specific rewrites)
      content = rewriteScriptContent(content, host, targetDomain)

      return new NextResponse(content, {
        status: response.status,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600',
        },
      })
    }

    // For other content types, pass through
    const data = await response.text()
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': response.headers.get('cache-control') || 'public, max-age=3600',
      },
    })
  } catch (error) {
    // Avoid logging anything that could contain PII
    console.error('Proxy error:', error instanceof Error ? error.message : 'Unknown error')

    // Return 204 for beacons, 500 for scripts
    const isBeacon = path.includes('collect') || CLARITY_BEACON_DOMAINS.some(d => targetDomain === d)
    if (isBeacon) {
      return new NextResponse(null, { status: 204 })
    }

    return new NextResponse('// Proxy error', {
      status: 500,
      headers: { 'Content-Type': 'text/javascript' }
    })
  }
}

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