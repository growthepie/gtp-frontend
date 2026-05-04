import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Forwards the request pathname as `x-pathname` so root-level Server
// Components can emit per-route JSON-LD as siblings of <Providers>, keeping
// the schema in parse-time HTML rather than RSC stream payloads.
export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    // Run on every page request; skip static assets and Next internals.
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:js|css|png|jpg|jpeg|gif|webp|svg|ico|map|woff2?|ttf|otf|json|xml|txt)$).*)",
  ],
};
