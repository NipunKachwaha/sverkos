import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

export async function POST() {
  try {
    const { userId } = await auth(); 
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Pehle members table se is user ka internal ID nikalo
    const { data: member, error: memberError } = await supabase
      .from("members")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (memberError || !member) {
      console.error("Member lookup failed:", memberError);
      return NextResponse.json({ error: "Member not found in DB." }, { status: 404 });
    }

    // 2. Ab check karo kya is member ka koi active session hai (Using member_id)
    let { data: session, error: fetchError } = await supabase
      .from("sessions")
      .select("id")
      .eq("member_id", member.id) 
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { 
      console.error("Supabase fetch error:", fetchError);
      throw fetchError;
    }

    // 3. Agar session nahi mila, toh naya banao (Using member_id)
    if (!session) {
      const { data: newSession, error: insertError } = await supabase
        .from("sessions")
        .insert({ member_id: member.id }) 
        .select("id")
        .single();
        
      if (insertError) throw insertError;
      session = newSession;
    }

    return NextResponse.json({ sessionId: session.id }, { status: 200 });

  } catch (error: any) {
    console.error("Error starting session:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}