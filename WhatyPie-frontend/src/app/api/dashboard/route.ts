import { authoption } from "@/src/app/api/auth/[...nextauth]/authOption";
import { PUBLIC_API_URL } from "@/src/constants/route";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { getBackendApiUrl } from "@/src/lib/server-api";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authoption);
    const token = session?.accessToken as string | undefined;
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();

    const response = await fetch(`${getBackendApiUrl()}/dashboard?${queryString}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ message: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
