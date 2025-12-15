// app/api/insights/t.js/route.ts
// gtag.js proxy
import { NextRequest, NextResponse } from 'next/server'
import { rewriteScriptContent } from '@/lib/analyticsConfig'
import { withAnalyticsValidation } from '@/lib/analyticsValidation'

async function handleGet(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  // Rename params back (_c -> cx, _g -> gtm, _i -> id)
  const ga4Id = process.env.NEXT_PUBLIC_GA4_ID || searchParams.get('_i') || searchParams.get('id') || ''

  if (!ga4Id) {
    console.error('GA4 ID not configured')
    return new NextResponse('// GA4 not configured', {
      status: 500,
      headers: { 'Content-Type': 'text/javascript' },
    })
  }

  try {
    // Build the gtag.js URL (hosted on googletagmanager.com, not google-analytics.com)
    const gtagUrl = new URL('https://www.googletagmanager.com/gtag/js')
    gtagUrl.searchParams.set('id', ga4Id)

    // Forward additional params, renaming vars
    // _c -> cx, _g -> gtm
    searchParams.forEach((value, key) => {
      if (key === '_c') {
        gtagUrl.searchParams.set('cx', value)
      } else if (key === '_g') {
        gtagUrl.searchParams.set('gtm', value)
      } else if (key !== 'id' && key !== '_i') {
        gtagUrl.searchParams.set(key, value)
      }
    })

    const response = await fetch(gtagUrl.toString(), {
      headers: {
        'User-Agent': request.headers.get('user-agent') || '',
      },
    })

    if (!response.ok) {
      console.error('gtag.js fetch failed:', response.status, response.statusText)
      return new NextResponse('// Failed to load analytics', {
        status: response.status,
        headers: { 'Content-Type': 'text/javascript' },
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
    console.error('gtag.js proxy error:', error instanceof Error ? error.message : 'Unknown error')
    return new NextResponse('// Error loading analytics', {
      status: 500,
      headers: { 'Content-Type': 'text/javascript' },
    })
  }
}

export const GET = withAnalyticsValidation(handleGet)

export const runtime = 'edge'
