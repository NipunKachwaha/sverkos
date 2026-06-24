import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

// GET: User ki current API keys fetch karna (apiKeyForCurrentMember ka replacement)
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("members")
      .select("api_key_preference, api_key_value, api_key_openai, api_key_xai, api_key_google")
      .eq("clerk_id", userId)
      .single();

    if (error) throw error;

    return NextResponse.json({ keys: data }, { status: 200 });
  } catch (error) {
    console.error("Error fetching keys:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST: Keys ko Update ya Delete karna (set aur delete mutations ka replacement)
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    
    // Frontend se jo keys aayengi, unhe database columns map kar rahe hain
    const updateData = {
      api_key_preference: body.preference,
      api_key_value: body.anthropic, // Anthropic key
      api_key_openai: body.openai,
      api_key_xai: body.xai,
      api_key_google: body.google,
    };

    // Supabase mein member record update karein
    const { error } = await supabase
      .from("members")
      .update(updateData)
      .eq("clerk_id", userId);

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error updating keys:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}