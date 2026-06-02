import { NextResponse } from "next/server";
import { getBackendApiUrl } from "@/src/lib/server-api";


export async function POST(request: Request) {
    try {
        const body = await request.json();

        const response = await fetch(`${getBackendApiUrl()}/contact-inquiry/create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { message: data.message || "Failed to submit inquiry" },
                { status: response.status }
            );
        }

        return NextResponse.json(data, { status: 201 });
    } catch (error: unknown) {
        console.error("Contact Inquiry POST error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
