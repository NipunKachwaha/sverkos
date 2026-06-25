import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Agar database query set nahi hai, toh currently null bhej do taaki 404 error na aaye
    return NextResponse.json({
      anthropicApiKey: null,
      openAiApiKey: null,
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}