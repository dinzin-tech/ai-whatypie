import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authoption } from "@/src/app/api/auth/[...nextauth]/authOption";
import { getBackendApiUrl } from "@/src/lib/server-api";


export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authoption);
    const token = session?.accessToken as string;
    const body = await req.json();
    const { id } = await params;

    const response = await fetch(`${getBackendApiUrl()}/subscription/${id}/cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ message: data.message || "Failed to cancel subscription" }, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    console.error("Cancel Subscription API error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
