import { NextRequest, NextResponse } from "next/server";
import { getBackendApiUrl } from "@/src/lib/server-api";


export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization");

    const response = await fetch(`${getBackendApiUrl()}/landing-page`, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: token }),
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching landing page:", error);
    return NextResponse.json({ error: "Failed to fetch landing page" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const token = request.headers.get("authorization");

    const response = await fetch(`${getBackendApiUrl()}/landing-page`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: token }),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error updating landing page:", error);
    return NextResponse.json({ error: "Failed to update landing page" }, { status: 500 });
  }
}
