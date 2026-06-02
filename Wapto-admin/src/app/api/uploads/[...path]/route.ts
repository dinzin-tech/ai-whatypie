import { NextRequest, NextResponse } from "next/server";
import { getStorageOrigin } from "@/src/lib/server-api";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await context.params;
    const segment = path.map((p) => encodeURIComponent(p)).join("/");
    const origin = getStorageOrigin();
    const upstream = await fetch(`${origin}/uploads/${segment}`, {
      cache: "no-store",
    });

    if (!upstream.ok) {
      return NextResponse.json({ error: "File not found" }, { status: upstream.status });
    }

    const contentType = upstream.headers.get("content-type") || "application/octet-stream";
    const body = await upstream.arrayBuffer();

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("Upload proxy error:", error);
    return NextResponse.json({ error: "Failed to load file" }, { status: 502 });
  }
}
