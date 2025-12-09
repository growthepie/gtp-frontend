// app/api/insights/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { resolveProxyDomain, rewriteScriptContent } from '@/lib/analyticsConfig'
import { withAnalyticsValidation } from '@/lib/analyticsValidation'

async function handleGet(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path)
}

async function handlePost(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path)
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
  const queryString = searchParams.toString()
  const targetUrl = queryString
    ? `https://${targetDomain}/${targetPath}?${queryString}`
    : `https://${targetDomain}/${targetPath}`

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

    const response = await fetch(targetUrl, options)

    // For tracking beacons (collect endpoints), return minimal response
    const isBeacon = path.includes('collect') || targetDomain.endsWith('.clarity.ms')
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

      // Apply all URL rewrites
      content = rewriteScriptContent(content, host)

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
    console.error('Proxy error:', error, 'Path:', path, 'Target:', targetDomain)

    // Return 204 for beacons, 500 for scripts
    const isBeacon = path.includes('collect') || targetDomain.endsWith('.clarity.ms')
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
