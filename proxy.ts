import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Matches files with extensions (e.g., .png, .js, .css, .woff2)
const PUBLIC_FILE = /\.[\w]+$/

const handleUrlNormalization = (request: NextRequest): NextResponse | null => {
  const { pathname } = request.nextUrl

  // Skip Next.js internals, API routes, and static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    PUBLIC_FILE.test(pathname)
  ) {
    return null
  }

  let normalizedPathname = pathname

  // Strip trailing backslashes (malformed URLs)
  if (normalizedPathname.endsWith('\\')) {
    normalizedPathname = normalizedPathname.replace(/\\+$/, '')
  }

  // Lowercase the pathname
  normalizedPathname = normalizedPathname.toLowerCase()

  // Redirect if pathname changed
  if (pathname !== normalizedPathname) {
    const url = request.nextUrl.clone()
    url.pathname = normalizedPathname
    return NextResponse.redirect(url, 301)
  }

  return null
}

export function proxy(request: NextRequest) {
  const redirect = handleUrlNormalization(request)
  if (redirect) return redirect

  // Forward the request pathname so root-level Server Components can read it
  // via headers() and emit per-route JSON-LD as parse-time HTML siblings of
  // the <Providers> client boundary.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', request.nextUrl.pathname)

  return NextResponse.next({
    request: { headers: requestHeaders },
  })
}
