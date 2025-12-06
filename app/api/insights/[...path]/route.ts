// app/api/insights/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { ANALYTICS_CONFIG } from '@/lib/analyticsConfig'

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
  
  let targetDomain = 'www.googletagmanager.com'
  let targetPath = path
  
  // Route to appropriate service
  if (path.includes('collect')) {
    // GA4 collection endpoint
    targetDomain = 'www.google-analytics.com'
  } else if (path.startsWith('c/')) {
    // Clarity endpoints (c/ prefix)
    targetDomain = 'www.clarity.ms'
    // Remove 'c/' prefix and add 'tag/' for Clarity
    targetPath = 'tag/' + path.substring(2)
  }
  
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

    // For tracking beacons, return minimal response
    if (path.includes('collect')) {
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
      
      // Use centralized URL rewrites from config
      ANALYTICS_CONFIG.urlRewrites.forEach(({ from, to }) => {
        const escapedFrom = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        content = content.replace(new RegExp(escapedFrom, 'g'), to)
      })
      
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
    console.error('Proxy error:', error, 'Path:', path)
    
    // Return 204 for beacons, 500 for scripts
    if (path.includes('collect')) {
      return new NextResponse(null, { status: 204 })
    }
    
    return new NextResponse('// Proxy error', { 
      status: 500,
      headers: { 'Content-Type': 'text/javascript' }
    })
  }
}

export const runtime = 'edge'