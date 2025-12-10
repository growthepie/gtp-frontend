// app/api/insights/p/route.ts
// Obfuscated GA4 collect endpoint proxy
import { NextRequest, NextResponse } from 'next/server'

const GA_COLLECT_URL = 'https://www.google-analytics.com/g/collect'

async function handleCollect(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryString = searchParams.toString()
    const targetUrl = queryString ? `${GA_COLLECT_URL}?${queryString}` : GA_COLLECT_URL

    const options: RequestInit = {
      method: request.method,
      headers: {
        'User-Agent': request.headers.get('user-agent') || '',
        'Content-Type': request.headers.get('content-type') || 'application/x-www-form-urlencoded',
      },
    }

    if (request.method === 'POST') {
      const body = await request.text()
      if (body) {
        options.body = body
      }
    }

    await fetch(targetUrl, options)

    // Return 204 for beacon
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('GA collect proxy error:', error)
    return new NextResponse(null, { status: 204 })
  }
}

export async function GET(request: NextRequest) {
  return handleCollect(request)
}

export async function POST(request: NextRequest) {
  return handleCollect(request)
}

export const runtime = 'edge'
