// app/api/insights/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { applyUrlRewrites, resolveProxyDomain } from '@/lib/analyticsConfig'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path)
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path)
}

async function proxyRequest(request: NextRequest, pathParts: string[]) {
  const path = pathParts.join('/')
  const { searchParams } = new URL(request.url)

  // Use the helper to resolve domain from path
  const { domain: targetDomain, targetPath } = resolveProxyDomain(path)
  
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

      // Get the host from the request for dynamic proxy URLs
      const host = request.headers.get('host') || 'localhost:3000'

      // Apply URL rewrites from config (handles wildcards)
      content = applyUrlRewrites(content)

      // Additional rewrites for blob-encoded domain references
      content = content.replace(/"www\.googletagmanager\.com"/g, `"${host}"`)
      content = content.replace(/"www\.google-analytics\.com"/g, `"${host}"`)

      // Also handle the full URL format in gtag.js (protocol + domain)
      content = content.replace(/https:\/\/www\.google-analytics\.com/g, `https://${host}`)
      content = content.replace(/https:\/\/www\.googletagmanager\.com/g, `https://${host}`)

      // Rewrite paths, vars
      content = content.replace(/\/gtag\/js\?([^"'\s]*)/g, (match, params) => {
        const renamed = params
          .replace(/\bcx=/g, '_c=')
          .replace(/\bgtm=/g, '_g=')
          .replace(/\bid=G-/g, '_i=G-');
        return '/api/insights/t.js?' + renamed;
      });
      content = content.replace(/\/gtag\/js/g, '/api/insights/t.js')
      // Note: GA4 collect goes through transport_url (configured in GTM) + /g/collect
      // We rewrite /g/collect to /p/
      content = content.replace(/\/g\/collect/g, '/p/')
      content = content.replace(/["']\/a\?/g, '"/api/insights/a?')

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

export const runtime = 'edge'