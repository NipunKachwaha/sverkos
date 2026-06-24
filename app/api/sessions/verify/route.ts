import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ isValid: false, error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ isValid: false, error: "Missing sessionId" }, { status: 400 });
    }

    // Check if the session exists and belongs to the authenticated user
    const { data: session, error } = await supabase
      .from("sessions")
      .select("id, profile_id")
      .eq("id", sessionId)
      .single();

    if (error || !session) {
      return NextResponse.json({ isValid: false }, { status: 200 });
    }

    const isValid = session.profile_id === userId;

    return NextResponse.json({ isValid }, { status: 200 });

  } catch (error) {
    console.error("Error verifying session:", error);
    return NextResponse.json({ isValid: false, error: "Internal Server Error" }, { status: 500 });
  }
}