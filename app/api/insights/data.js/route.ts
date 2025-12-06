// app/api/insights/data.js/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { ANALYTICS_CONFIG } from '@/lib/analyticsConfig'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const gtpGtmId = process.env.NEXT_PUBLIC_GTM_ID;
  
  if (!gtpGtmId) {
    console.error('GTM ID not configured')
    return new NextResponse('// GTM not configured', { 
      status: 500,
      headers: { 'Content-Type': 'text/javascript' }
    })
  }
  
  try {
    const gtmUrl = new URL('https://www.googletagmanager.com/gtm.js')
    gtmUrl.searchParams.set('id', gtpGtmId)
    
    const dataLayerName = searchParams.get('l')
    if (dataLayerName && dataLayerName !== 'dataLayer') {
      gtmUrl.searchParams.set('l', dataLayerName)
    }
    
    searchParams.forEach((value, key) => {
      if (key !== 'l') {
        gtmUrl.searchParams.set(key, value)
      }
    })
    
    const response = await fetch(gtmUrl.toString(), {
      headers: {
        'User-Agent': request.headers.get('user-agent') || '',
      },
    })

    if (!response.ok) {
      console.error('GTM fetch failed:', response.status, response.statusText)
      return new NextResponse('// Failed to load analytics', { 
        status: response.status,
        headers: { 'Content-Type': 'text/javascript' }
      })
    }

    let script = await response.text()
    
    // Use centralized URL rewrites
    ANALYTICS_CONFIG.urlRewrites.forEach(({ from, to }) => {
      const escapedFrom = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      script = script.replace(new RegExp(escapedFrom, 'g'), to)
    })

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