import { NextRequest, NextResponse } from "next/server";
import { generateDishIdea } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt }: { prompt: string } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const headerKey = req.headers.get("x-gemini-api-key");

    const dish = await generateDishIdea({
      prompt,
      apiKey: headerKey,
    });

    return NextResponse.json(dish);
  } catch (error: unknown) {
    console.error("Dish creator API error:", error);
    return NextResponse.json(
      { error: "Failed to generate dish concept" },
      { status: 500 }
    );
  }
}
