// app/api/insights/n.html/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const gtpGtmId = process.env.NEXT_PUBLIC_GTM_ID;
  
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Analytics</title>
</head>
<body>
  <iframe src="https://www.googletagmanager.com/ns.html?id=${gtpGtmId}" 
          height="0" 
          width="0" 
          style="display:none;visibility:hidden"
          title="Google Tag Manager"></iframe>
</body>
</html>`

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}

export const runtime = 'edge'