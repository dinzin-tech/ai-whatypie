import { authoption } from "@/src/app/api/auth/[...nextauth]/authOption";
import { PUBLIC_API_URL } from "@/src/constants/route";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getBackendApiUrl } from "@/src/lib/server-api";

async function getAuthHeaders() {
  const session = await getServerSession(authoption);
  const token = session?.accessToken as string | undefined;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function GET(request: NextRequest, context: { params: Promise<{ wabaId: string }> }) {
  try {
    const { wabaId } = await context.params;
    const headers = await getAuthHeaders();

    const response = await fetch(`${getBackendApiUrl()}/whatsapp/${wabaId}/phone-numbers`, {
      headers,
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching wabaId:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch wabaId" }, { status: 500 });
  }
}
