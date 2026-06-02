import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authoption } from "@/src/app/api/auth/[...nextauth]/authOption";
import { getBackendApiUrl } from "@/src/lib/server-api";


export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authoption);
    const token = session?.accessToken as string | undefined;

    const queryString = request.nextUrl.searchParams.toString();
    const url = `${getBackendApiUrl()}/pages${queryString ? `?${queryString}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ message: data.message || "Failed to fetch pages" }, { status: response.status });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("Pages GET error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authoption);
    const token = session?.accessToken as string | undefined;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.formData();
    const url = `${getBackendApiUrl()}/pages/create`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: body,
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ message: data.message || "Failed to create page" }, { status: response.status });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("Pages POST error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
