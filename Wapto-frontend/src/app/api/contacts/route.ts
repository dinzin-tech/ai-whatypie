import { getServerSession } from "next-auth";
import { authoption } from "../auth/[...nextauth]/authOption";
import { NextRequest, NextResponse } from "next/server";
import { PUBLIC_API_URL } from "@/src/constants/route";
import { getBackendApiUrl } from "@/src/lib/server-api";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authoption);
    const token = session?.accessToken as string | undefined;

    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();

    const response = await fetch(`${getBackendApiUrl()}/contacts?${queryString}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({ error: error || "Failed to fetch contacts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authoption);
    const token = session?.accessToken as string | undefined;

    const body = await request.json();

    const response = await fetch(`${getBackendApiUrl()}/contacts`, {
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
    console.error("Error creating contacts:", error);
    return NextResponse.json({ error: "Failed to create contacts" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authoption);
    const token = session?.accessToken as string;
    const body = await request.json();

    const response = await fetch(`${getBackendApiUrl()}/contacts/delete`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error in delete contacts.:", error);
    return NextResponse.json({ error: error || "Failed to delete contacts." }, { status: 500 });
  }
}
