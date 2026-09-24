import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authoption } from "../../auth/[...nextauth]/authOption";
import { getBackendApiUrl } from "@/src/lib/server-api";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authoption);
    const token = session?.accessToken as string;

    const body = await request.json();

    const response = await fetch(`${getBackendApiUrl()}/user-settings/test-connection`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          code: data.code || "UNKNOWN_PROVIDER_ERROR",
          message: data.message || data.error || "AI connection test failed",
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    console.error("Setup API test connection error:", error);
    return NextResponse.json(
      {
        success: false,
        code: "UNKNOWN_PROVIDER_ERROR",
        message: "Internal server error during connection test",
      },
      { status: 500 }
    );
  }
}
