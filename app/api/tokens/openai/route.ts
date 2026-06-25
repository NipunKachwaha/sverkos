import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Generate a secure proxy token for the user session
    // In production, you would save this to the 'member_openai_tokens' table
    const newToken = crypto.randomUUID();

    return NextResponse.json({ 
      token: newToken,
      // You can also pass the real API key here if you want it directly in the frontend environment
      // apiKey: process.env.OPENAI_API_KEY 
    }, { status: 200 });
  } catch (error) {
    console.error("OpenAI Token Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}