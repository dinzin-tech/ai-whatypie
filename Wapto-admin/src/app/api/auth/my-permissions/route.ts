import { getBackendApiUrl } from "@/src/lib/server-api";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");

    const response = await fetch(`${getBackendApiUrl()}/auth/my-permissions`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ message: data.message || "Failed to fetch permissions" }, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    console.error("My Permissions API error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
