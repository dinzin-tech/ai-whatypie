import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authoption } from "../../auth/[...nextauth]/authOption";
import { getBackendApiUrl } from "@/src/lib/server-api";


export async function GET(req: Request) {
  try {
    const session = await getServerSession(authoption);
    const token = session?.accessToken as string;

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!from || !to) {
      return NextResponse.json({ message: "Both 'from' and 'to' currency codes are required" }, { status: 400 });
    }

    const response = await fetch(`${getBackendApiUrl()}/currencies/get-exchange-rate?from=${from}&to=${to}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ message: data.message || "Failed to fetch exchange rate" }, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    console.error("Exchange Rate API error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
