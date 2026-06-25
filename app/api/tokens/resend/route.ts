import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Generate a secure proxy token for Resend
    const newToken = crypto.randomUUID();

    return NextResponse.json({ 
      token: newToken,
    }, { status: 200 });
  } catch (error) {
    console.error("Resend Token Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}