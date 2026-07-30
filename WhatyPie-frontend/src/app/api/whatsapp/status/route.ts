import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authoption } from "../../auth/[...nextauth]/authOption";
import { getBackendApiUrl } from "@/src/lib/server-api";


export async function GET() {
  try {
    const session = await getServerSession(authoption);
    const token = session?.accessToken as string;

    const response = await fetch(`${getBackendApiUrl()}/whatsapp/status`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ message: data.message || "Status update failed" }, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    console.error("Status API error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
