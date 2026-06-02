import { getBackendApiUrl } from "@/src/lib/server-api";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(`${getBackendApiUrl()}/auth/roles`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ message: data.message || "Failed to fetch roles" }, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    console.error("Public Roles API error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
