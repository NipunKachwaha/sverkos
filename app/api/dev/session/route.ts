import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  try {
    // SECURITY: Ensure this can only be run if a specific secret is provided
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.DEV_DANGER_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clerkId = searchParams.get("clerkId");

    if (!clerkId) {
      return NextResponse.json({ error: "Missing clerkId parameter" }, { status: 400 });
    }

    // 1. Find the member by Clerk ID
    const { data: member, error: memberError } = await supabase
      .from("members")
      .select("id")
      .eq("clerk_id", clerkId)
      .single();

    if (memberError || !member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // 2. Find their active session
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("*")
      .eq("member_id", member.id)
      .limit(1)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ session }, { status: 200 });
  } catch (error) {
    console.error("Failed to find session:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}