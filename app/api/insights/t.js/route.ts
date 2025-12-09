// app/api/insights/t.js/route.ts
// Obfuscated gtag.js proxy to avoid ad blocker filter lists
import { NextRequest, NextResponse } from 'next/server'
import { applyUrlRewrites } from '@/lib/analyticsConfig'

export async function GET(request: NextRequest) {
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

    // Forward additional params
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

    // Get the host from the request for dynamic proxy URLs
    const host = request.headers.get('host') || 'localhost:3000'

    // Apply URL rewrites from config
    script = applyUrlRewrites(script)

    // Rewrite domain references
    script = script.replace(/"www\.googletagmanager\.com"/g, `"${host}"`)
    script = script.replace(/"www\.google-analytics\.com"/g, `"${host}"`)
    script = script.replace(/https:\/\/www\.google-analytics\.com/g, `https://${host}`)
    script = script.replace(/https:\/\/www\.googletagmanager\.com/g, `https://${host}`)

    // Rewrite paths
    script = script.replace(/\/gtag\/js/g, '/api/insights/t.js')
    // Note: GA4 appends /g/collect to transport_url, so we only need /p/
    script = script.replace(/\/g\/collect/g, '/p/')

    // Rename param literals that get concatenated at runtime to build URLs
    script = script.replace(/&cx=c/g, '&_c=c')
    script = script.replace(/&cx=/g, '&_c=')
    script = script.replace(/\?cx=/g, '?_c=')
    script = script.replace(/&gtm=/g, '&_g=')
    script = script.replace(/\?gtm=/g, '?_g=')

    return new NextResponse(script, {
      status: 200,
      headers: {
        'Content-Type': 'text/javascript; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('gtag.js proxy error:', error)
    return new NextResponse('// Error loading analytics', {
      status: 500,
      headers: { 'Content-Type': 'text/javascript' },
    })
  }
}

export const runtime = 'edge'
