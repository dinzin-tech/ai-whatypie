import { NextRequest, NextResponse } from "next/server";
import { getBackendApiUrl } from "@/src/lib/server-api";


export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();

    const token = request.headers.get("authorization");

    const response = await fetch(`${getBackendApiUrl()}/subscription/payments?${queryString}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: token }),
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching payments history:", error);
    return NextResponse.json({ error: "Failed to fetch payments history" }, { status: 500 });
  }
}
