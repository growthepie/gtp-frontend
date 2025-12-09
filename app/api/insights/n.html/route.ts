// app/api/insights/n.html/route.ts
// Proxy for GTM noscript iframe
import { NextRequest, NextResponse } from 'next/server'
import { ANALYTICS_CONFIG } from '@/lib/analyticsConfig'

export async function GET(request: NextRequest) {
  const gtpGtmId = ANALYTICS_CONFIG.gtmId;

  if (!gtpGtmId) {
    return new NextResponse('<!-- GTM not configured -->', {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    })
  }

  try {
    // Fetch the actual noscript content from GTM
    const response = await fetch(`https://www.googletagmanager.com/ns.html?id=${gtpGtmId}`, {
      headers: {
        'User-Agent': request.headers.get('user-agent') || '',
      },
    })

    if (!response.ok) {
      return new NextResponse('<!-- GTM load failed -->', {
        status: response.status,
        headers: { 'Content-Type': 'text/html' },
      })
    }

    const html = await response.text()

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('GTM noscript proxy error:', error)
    return new NextResponse('<!-- GTM error -->', {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    })
  }
}

export const runtime = 'edge'