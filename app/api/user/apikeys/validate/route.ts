import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { provider, apiKey } = await req.json();

    if (!apiKey) {
      return NextResponse.json({ isValid: false, error: "API key is required" }, { status: 400 });
    }

    let isValid = false;

    // Har provider ki API par dummy request bhej kar check karein (Convex action replacement)
    switch (provider) {
      case "anthropic":
        const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": apiKey },
        });
        isValid = anthropicRes.status !== 401;
        break;

      case "openai":
        const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        });
        isValid = openaiRes.status !== 401;
        break;

      case "google":
        const googleRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        isValid = googleRes.status !== 400;
        break;

      case "xai":
        const xaiRes = await fetch("https://api.x.ai/v1/models", {
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        });
        isValid = xaiRes.status !== 400;
        break;

      default:
        return NextResponse.json({ isValid: false, error: "Invalid provider" }, { status: 400 });
    }

    return NextResponse.json({ isValid }, { status: 200 });
  } catch (error) {
    console.error("Error validating API key:", error);
    return NextResponse.json({ isValid: false, error: "Validation failed" }, { status: 500 });
  }
}