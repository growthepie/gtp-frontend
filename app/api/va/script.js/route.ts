// app/api/va/script.js/route.ts
// Proxy for Vercel Analytics script to avoid ad blockers
import { NextRequest, NextResponse } from 'next/server'

const VERCEL_ANALYTICS_SCRIPT_URL = 'https://cdn.vercel-insights.com/v1/script.js'

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(VERCEL_ANALYTICS_SCRIPT_URL, {
      headers: {
        'User-Agent': request.headers.get('user-agent') || '',
      },
    })

    if (!response.ok) {
      return new NextResponse('// Failed to load script', {
        status: response.status,
        headers: { 'Content-Type': 'text/javascript' },
      })
    }

    let script = await response.text()

    // Get the host from the request
    const host = request.headers.get('host') || 'localhost:3000'

    // Rewrite the vitals endpoint to use our proxy
    script = script.replace(
      /https:\/\/vitals\.vercel-analytics\.com\/v1\/vitals/g,
      `https://${host}/api/va/vitals`
    )

    // Also handle any other vercel-insights domains
    script = script.replace(
      /https:\/\/cdn\.vercel-insights\.com/g,
      `https://${host}/api/va`
    )

    return new NextResponse(script, {
      status: 200,
      headers: {
        'Content-Type': 'text/javascript; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('Vercel Analytics script proxy error:', error)
    return new NextResponse('// Error loading script', {
      status: 500,
      headers: { 'Content-Type': 'text/javascript' },
    })
  }
}

export const runtime = 'edge'
