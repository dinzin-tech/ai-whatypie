import { getServerSession } from "next-auth";
import { authoption } from "../../auth/[...nextauth]/authOption";
import { NextResponse } from "next/server";
import { PUBLIC_API_URL } from "@/src/constants/route";
import { getBackendApiUrl } from "@/src/lib/server-api";

export async function POST() {
  try {
    const session = await getServerSession(authoption);
    const token = session?.accessToken as string | undefined;

    const response = await fetch(`${getBackendApiUrl()}/contacts/export`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Export contacts error:", error);
    return NextResponse.json({ message: "Failed to export contacts" }, { status: 500 });
  }
}
