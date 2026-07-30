import { NextRequest, NextResponse } from "next/server";
import { getBackendApiUrl } from "@/src/lib/server-api";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const url = `${getBackendApiUrl()}/pages/public/${encodeURIComponent(slug)}`;

    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ message: data.message || "Failed to fetch page" }, { status: response.status });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("Public page GET error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
