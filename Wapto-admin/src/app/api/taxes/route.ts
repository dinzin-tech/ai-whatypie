import { NextRequest, NextResponse } from "next/server";
import { getBackendApiUrl } from "@/src/lib/server-api";


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = request.headers.get("authorization");

    const response = await fetch(`${getBackendApiUrl()}/taxes?${searchParams.toString()}`, {
      headers: {
        ...(token && { Authorization: token }),
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching taxes:", error);
    return NextResponse.json({ error: "Failed to fetch taxes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = request.headers.get("authorization");

    const response = await fetch(`${getBackendApiUrl()}/taxes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: token }),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error creating tax:", error);
    return NextResponse.json({ error: "Failed to create tax" }, { status: 500 });
  }
}
