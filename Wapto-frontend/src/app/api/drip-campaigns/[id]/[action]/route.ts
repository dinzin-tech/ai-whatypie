import { getServerSession } from "next-auth";
import { authoption } from "../../../auth/[...nextauth]/authOption";
import { NextRequest, NextResponse } from "next/server";
import { getBackendApiUrl } from "@/src/lib/server-api";

const ALLOWED_ACTIONS = new Set(["preview-audience", "activate", "pause", "resume", "retry-pending"]);

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; action: string }> }) {
  try {
    const session = await getServerSession(authoption);
    const token = session?.accessToken as string | undefined;
    const { id, action } = await params;

    if (!ALLOWED_ACTIONS.has(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const body =
      action === "pause" || action === "resume" || action === "retry-pending"
        ? undefined
        : await request.json().catch(() => ({}));

    const response = await fetch(`${getBackendApiUrl()}/drip-campaigns/${id}/${action}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({ error: "Drip campaign action failed" }, { status: 500 });
  }
}
