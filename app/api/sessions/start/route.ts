import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase"; // Service role client

export async function POST() {
  try {
    const { userId } = await auth(); // Clerk se logged-in user
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check user active session are available in Supabase
    let { data: session, error: fetchError } = await supabase
      .from("sessions")
      .select("id")
      .eq("profile_id", userId) // Webhook ID match
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = No rows found
      console.error("Supabase fetch error:", fetchError);
      throw fetchError;
    }

    // If no session exists, create a new one
    if (!session) {
      const { data: newSession, error: insertError } = await supabase
        .from("sessions")
        .insert({ profile_id: userId })
        .select("id")
        .single();
        
      if (insertError) throw insertError;
      session = newSession;
    }

    return NextResponse.json({ sessionId: session.id }, { status: 200 });

  } catch (error) {
    console.error("Error starting session:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}