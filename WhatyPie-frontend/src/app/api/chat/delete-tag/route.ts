import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authoption } from "../../auth/[...nextauth]/authOption";
import { getBackendApiUrl } from "@/src/lib/server-api";


export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authoption);
    const token = session?.accessToken as string;
    const body = await request.json();

    const response = await fetch(`${getBackendApiUrl()}/chat/delete-tag`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
        return NextResponse.json({ message: data.message || "Delete tag failed" }, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error in delete tag:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
