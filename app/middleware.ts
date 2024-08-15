import { IS_PRODUCTION } from "@/lib/helpers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Check if the apiRoot is set in localStorage (client-side)
  const apiRoot = IS_PRODUCTION
    ? "v1"
    : request.cookies.get("apiRoot")?.value || "v1";

  console.log("middleware::apiRoot", apiRoot);

  // If it's not set, we don't need to do anything
  if (!apiRoot) {
    return response;
  }

  // If it is set, make sure it's also set as a cookie for server-side access
  response.cookies.set("apiRoot", apiRoot);

  return response;
}

export const config = {
  matcher: "/:path*",
};
