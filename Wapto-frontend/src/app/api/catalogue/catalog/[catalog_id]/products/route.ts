import { authoption } from "@/src/app/api/auth/[...nextauth]/authOption";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { getBackendApiUrl } from "@/src/lib/server-api";


export async function GET(req: Request, { params }: { params: Promise<{ catalog_id: string }> }) {
  try {
    const session = await getServerSession(authoption);
    const token = session?.accessToken as string;
    const { catalog_id } = await params;
    const { searchParams } = new URL(req.url);
    const query = searchParams.toString();

    const response = await fetch(`${getBackendApiUrl()}/ecommerce-catalog/catalog/${catalog_id}/products?${query}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ message: data.message || "Failed to fetch products" }, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    console.error("Products get API error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ catalog_id: string }> }) {
  try {
    const session = await getServerSession(authoption);
    const token = session?.accessToken as string;
    const { catalog_id } = await params;
    const body = await req.json();

    const response = await fetch(`${getBackendApiUrl()}/ecommerce-catalog/catalog/${catalog_id}/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ message: data.message || "Failed to create product" }, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    console.error("Product create API error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
