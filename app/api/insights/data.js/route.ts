// app/api/insights/data.js/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { ANALYTICS_CONFIG, rewriteScriptContent } from '@/lib/analyticsConfig'
import { withAnalyticsValidation } from '@/lib/analyticsValidation'

async function handleGet(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const gtpGtmId = ANALYTICS_CONFIG.gtmId

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
    const host = request.headers.get('host') || 'localhost:3000'

    // Apply all URL rewrites
    script = rewriteScriptContent(script, host)

    return new NextResponse(script, {
      status: 200,
      headers: {
        'Content-Type': 'text/javascript; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    // Avoid logging anything that could contain PII
    console.error('GTM proxy error:', error instanceof Error ? error.message : 'Unknown error')
    return new NextResponse('// Error loading analytics', {
      status: 500,
      headers: { 'Content-Type': 'text/javascript' }
    })
  }
}

export const GET = withAnalyticsValidation(handleGet)

export const runtime = 'edge'
