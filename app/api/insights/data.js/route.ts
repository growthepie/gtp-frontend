// app/api/insights/data.js/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { ANALYTICS_CONFIG, applyUrlRewrites } from '@/lib/analyticsConfig'

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

    // Get the host from the request for dynamic proxy URLs
    const host = request.headers.get('host') || 'localhost:3000'
    const protocol = host.includes('localhost') ? 'https://' : 'https://'
    const baseUrl = `${protocol}${host}`

    // Apply URL rewrites from config (handles wildcards)
    script = applyUrlRewrites(script)

    // Additional rewrites for blob-encoded domain references in GTM script
    // These handle cases like "21":"www.googletagmanager.com" in the blob
    script = script.replace(/"www\.googletagmanager\.com"/g, `"${host}"`)
    script = script.replace(/"www\.google-analytics\.com"/g, `"${host}"`)

    // Also handle the full URL format (protocol + domain)
    script = script.replace(/https:\/\/www\.google-analytics\.com/g, `https://${host}`)
    script = script.replace(/https:\/\/www\.googletagmanager\.com/g, `https://${host}`)

    // Rewrite gtag/js and collect paths
    script = script.replace(/\/gtag\/js\?([^"'\s]*)/g, (match, params) => {
      const renamed = params
        .replace(/\bcx=/g, '_c=')
        .replace(/\bgtm=/g, '_g=')
        .replace(/\bid=G-/g, '_i=G-');
      return '/api/insights/t.js?' + renamed;
    });
    script = script.replace(/\/gtag\/js/g, '/api/insights/t.js')
    // Note: GA4 collect goes through transport_url (configured in GTM) + /g/collect
    // We rewrite /g/collect to /p/
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
    console.error('GTM proxy error:', error)
    return new NextResponse('// Error loading analytics', { 
      status: 500,
      headers: { 'Content-Type': 'text/javascript' }
    })
  }
}

export const runtime = 'edge'