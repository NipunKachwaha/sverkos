import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase"; 

export async function POST() {
  try {
    const { userId } = await auth(); 
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let { data: member, error: memberError } = await supabase
      .from("members")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (memberError && memberError.code === 'PGRST116') {
      console.log(`Member not found for clerk_id: ${userId}. Creating new member...`);
      
      const { data: newMember, error: insertMemberError } = await supabase
        .from("members")
        .insert({ clerk_id: userId })
        .select("id")
        .single();

      if (insertMemberError) {
        console.error("Failed to create member:", insertMemberError);
        return NextResponse.json({ error: "Could not create member in DB." }, { status: 500 });
      }
      member = newMember;
      
    } else if (memberError || !member) {
      console.error("Member lookup failed:", memberError);
      return NextResponse.json({ error: "Member not found in DB." }, { status: 404 });
    }

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