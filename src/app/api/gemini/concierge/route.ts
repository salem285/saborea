import { NextRequest, NextResponse } from "next/server";
import {
  generateCulinaryRecommendation,
  type ConciergeMenuItemSummary,
} from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      message,
      menu = [],
      cartItemNames = [],
    }: {
      message: string;
      menu: ConciergeMenuItemSummary[];
      cartItemNames?: string[];
    } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Support API key provided via header from client test bar if present
    const headerKey = req.headers.get("x-gemini-api-key");

    const recommendation = await generateCulinaryRecommendation({
      message,
      menu,
      cartItemNames,
      apiKey: headerKey,
    });

    return NextResponse.json(recommendation);
  } catch (error: unknown) {
    console.error("Concierge API error:", error);
    return NextResponse.json(
      { error: "Failed to generate culinary recommendation" },
      { status: 500 }
    );
  }
}
