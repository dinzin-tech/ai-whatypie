import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { PUBLIC_API_URL } from "@/src/constants/route";
import { authoption } from "../../../auth/[...nextauth]/authOption";
import { getBackendApiUrl } from "@/src/lib/server-api";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authoption);
    const token = session?.accessToken as string | undefined;

    const body = await request.json();

    const response = await fetch(`${getBackendApiUrl()}/whatsapp/calling/assign-agent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error assigning AI call agent:", error);
    return NextResponse.json({ error: "Failed to assign AI call agent" }, { status: 500 });
  }
}
