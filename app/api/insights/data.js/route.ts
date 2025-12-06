// app/api/insights/data.js/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const gtpGtmId = process.env.NEXT_PUBLIC_GTM_ID;
  
  try {
    // Fetch GTM script from Google
    const containerId = searchParams.get('id') || process.env.NEXT_PUBLIC_GTM_ID;
    const gtmUrl = `https://www.googletagmanager.com/gtm.js?id=${containerId}`;
    const queryString = searchParams.toString()
    
    const response = await fetch(
      queryString ? `${gtmUrl}&${queryString}` : gtmUrl,
      {
        headers: {
          'User-Agent': request.headers.get('user-agent') || '',
        },
      }
    )

    if (!response.ok) {
      console.error('GTM fetch failed:', response.status)
      return new NextResponse('Failed to load analytics', { status: response.status })
    }

    const script = await response.text()

    return new NextResponse(script, {
      status: 200,
      headers: {
        'Content-Type': 'text/javascript; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('GTM proxy error:', error)
    return new NextResponse('// Error loading analytics', { 
      status: 500,
      headers: { 'Content-Type': 'text/javascript' }
    })
  }
}

export const runtime = 'edge'