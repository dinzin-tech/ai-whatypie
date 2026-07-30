import { getServerSession } from "next-auth";
import { authoption } from "../../auth/[...nextauth]/authOption";
import { NextRequest, NextResponse } from "next/server";
import { PUBLIC_API_URL } from "@/src/constants/route";
import { getBackendApiUrl } from "@/src/lib/server-api";

/** POST /api/sequences/steps — create a step */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authoption);
    const token = session?.accessToken as string | undefined;

    const body = await request.json();

    const response = await fetch(`${getBackendApiUrl()}/sequences/steps`, {
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
    console.error("Error creating sequence step:", error);
    return NextResponse.json({ success: false, message: "Failed to create sequence step" }, { status: 500 });
  }
}
