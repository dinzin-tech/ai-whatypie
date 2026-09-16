/* eslint-disable @typescript-eslint/no-explicit-any */
import { getServerSession } from "next-auth/next";
import { authoption } from "../../../auth/[...nextauth]/authOption";
import { NextRequest, NextResponse } from "next/server";
import { getBackendApiUrl } from "@/src/lib/server-api";

async function handleSync(request: NextRequest) {
  try {
    const session = await getServerSession(authoption);
    const token = session?.accessToken as string | undefined;

    const response = await fetch(`${getBackendApiUrl()}/facebook/linked-accounts/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("Error in syncLinkedSocialAccounts proxy:", error);
    return NextResponse.json({ success: false, message: "Internal server error", error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return handleSync(request);
}

export async function GET(request: NextRequest) {
  return handleSync(request);
}
