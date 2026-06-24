import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { userId } = await auth();
    
    // Agar user logged in nahi hai, toh false return karo
    if (!userId) {
      return NextResponse.json({ isAdmin: false }, { status: 200 });
    }

    // Supabase se is_admin status check karo
    const { data, error } = await supabase
      .from("members")
      .select("is_admin")
      .eq("clerk_id", userId)
      .single();

    if (error || !data) {
      return NextResponse.json({ isAdmin: false }, { status: 200 });
    }

    return NextResponse.json({ isAdmin: !!data.is_admin }, { status: 200 });

  } catch (error) {
    console.error("Admin status check failed:", error);
    return NextResponse.json({ isAdmin: false }, { status: 500 });
  }
}