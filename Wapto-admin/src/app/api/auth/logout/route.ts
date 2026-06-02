import { getBackendApiUrl } from "@/src/lib/server-api";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("authToken")?.value || request.headers.get("Authorization")?.replace("Bearer ", "");

    if (token) {
      await fetch(`${getBackendApiUrl()}/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
    }
    const response = NextResponse.json({ message: "Logged out successfully" }, { status: 200 });
    response.cookies.delete("authToken");
    return response;
  } catch  {
    const response = NextResponse.json({ message: "Logged out successfully" }, { status: 200 });
    response.cookies.delete("authToken");
    return response;
  }
}
