import { NextResponse } from "next/server";

const OLI_API_BASE = "https://api.openlabelsinitiative.org";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const upstream = new URL("/attestations", OLI_API_BASE);
    searchParams.forEach((value, key) => upstream.searchParams.append(key, value));

    const res = await fetch(upstream.toString(), {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Proxy error." }, { status: 500 });
  }
}
