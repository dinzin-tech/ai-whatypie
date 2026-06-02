import { NextResponse } from "next/server";
import { getBackendApiUrl } from "@/src/lib/server-api";


export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const response = await fetch(`${getBackendApiUrl()}/plan/${id}`);

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ message: data.message || "Active plans fetch failed" }, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    console.error("Plans API error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
