import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authoption } from "../auth/[...nextauth]/authOption";
import { getBackendApiUrl } from "@/src/lib/server-api";

const LANDING_FALLBACK = {
  success: true,
  data: {
    hero_section: {
      badge: "WhatyPie",
      title: "WhatsApp Marketing Platform",
      description: "Connect with customers on WhatsApp.",
      primary_button: { text: "Get Started", link: "/auth/register" },
      hero_image: "/assets/logos/wapto-logo.png",
      floating_images: [],
    },
    features_section: { features: [] },
    footer_section: {},
  },
};

export async function GET() {
  try {
    const response = await fetch(`${getBackendApiUrl()}/landing-page`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.warn("Landing page API returned", response.status, "— using fallback");
      return NextResponse.json(LANDING_FALLBACK, { status: 200 });
    }

    const data = await response.json();
    if (!data?.data) {
      return NextResponse.json(LANDING_FALLBACK, { status: 200 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    console.error("Landing Page GET error:", error);
    return NextResponse.json(LANDING_FALLBACK, { status: 200 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authoption);
    const token = session?.accessToken as string;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const response = await fetch(`${getBackendApiUrl()}/landing-page`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ message: data.message || "Failed to update landing page" }, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    console.error("Landing Page PUT error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
