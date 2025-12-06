// app/api/insights/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyToGoogle(request, params.path)
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyToGoogle(request, params.path)
}

async function proxyToGoogle(request: NextRequest, pathParts: string[]) {
  const path = pathParts.join('/')
  const { searchParams } = new URL(request.url)
  
  // Determine the correct Google domain
  let googleDomain = 'www.googletagmanager.com'
  if (path.includes('collect')) {
    googleDomain = 'www.google-analytics.com'
  }
  
  // Build the Google URL
  const queryString = searchParams.toString()
  const googleUrl = queryString 
    ? `https://${googleDomain}/${path}?${queryString}`
    : `https://${googleDomain}/${path}`

  try {
    const options: RequestInit = {
      method: request.method,
      headers: {
        'User-Agent': request.headers.get('user-agent') || '',
        'Content-Type': request.headers.get('content-type') || 'application/x-www-form-urlencoded',
      },
    }

    // Forward body for POST requests (analytics beacons)
    if (request.method === 'POST') {
      const body = await request.text()
      if (body) {
        options.body = body
      }
    }

    const response = await fetch(googleUrl, options)

    // For tracking pixels/beacons, return minimal response
    if (path.includes('collect')) {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    // For other responses (like gtag.js), forward content
    const contentType = response.headers.get('content-type') || 'text/plain'
    const data = await response.text()
    
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': response.headers.get('cache-control') || 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('Analytics proxy error:', error, 'Path:', path)
    
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