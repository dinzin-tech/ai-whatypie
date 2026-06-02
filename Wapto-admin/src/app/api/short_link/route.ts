import { NextRequest, NextResponse } from "next/server";
import { getBackendApiUrl } from "@/src/lib/server-api";


export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const token = request.headers.get("authorization");

    const response = await fetch(`${getBackendApiUrl()}/short-links?${queryString}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: token }),
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Failed to fetch short links", details: message }, { status: 500 });
  }
}
