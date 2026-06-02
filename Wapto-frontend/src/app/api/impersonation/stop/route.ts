/* eslint-disable @typescript-eslint/no-explicit-any */
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authoption } from "../../auth/[...nextauth]/authOption";
import { getBackendApiUrl } from "@/src/lib/server-api";


export async function POST() {
  try {
    const session = await getServerSession(authoption);
    const token = (session as any)?.accessToken;

    const response = await fetch(`${getBackendApiUrl()}/impersonation/stop`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ message: data.message || "Failed to stop impersonation" }, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("Stop Impersonation proxy error:", error);
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
  }
}
