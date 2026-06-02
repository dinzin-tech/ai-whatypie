import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authoption } from "../../../auth/[...nextauth]/authOption";
import { getBackendApiUrl } from "@/src/lib/server-api";


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ phoneNoId: string }> }
) {
  try {
    const { phoneNoId } = await params;
    const session = await getServerSession(authoption);
    const token = session?.accessToken as string;

    const response = await fetch(`${getBackendApiUrl()}/widgets/phone/${phoneNoId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ message: data.message || "Failed to fetch widget" }, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    console.error("Fetch widget API error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
