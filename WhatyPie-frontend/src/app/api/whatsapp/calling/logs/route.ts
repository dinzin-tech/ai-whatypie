import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { PUBLIC_API_URL } from "@/src/constants/route";
import { authoption } from "../../../auth/[...nextauth]/authOption";
import { getBackendApiUrl } from "@/src/lib/server-api";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authoption);
    const token = session?.accessToken as string | undefined;

    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();

    const response = await fetch(`${getBackendApiUrl()}/whatsapp/calling/logs?${queryString}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({ error: error || "Failed to fetch logs" }, { status: 500 });
  }
}
