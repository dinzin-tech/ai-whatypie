import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authoption } from "../../../auth/[...nextauth]/authOption";
import { getBackendApiUrl } from "@/src/lib/server-api";


export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authoption);
    const token = session?.accessToken as string;
    const { id } = await params;
    const body = await request.json();

    const response = await fetch(`${getBackendApiUrl()}/ecommerce-webhook/${id}/map-template`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ message: data.message || "Failed to map template" }, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    console.error("Webhook Map Template API error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
