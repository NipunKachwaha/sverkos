import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase"; // Use your service role client here

export async function POST(req: Request) {
  try {
    // SECURITY: Ensure this can only be run if a specific secret is provided
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.DEV_DANGER_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Double check we are not in the production environment
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Cannot run in production" }, { status: 403 });
    }

    // In Supabase, wiping tables is best done by deleting from the core tables
    // due to cascading deletes (ON DELETE CASCADE) in your Drizzle schema.
    // Deleting users/members will automatically delete their sessions, chats, and shares.
    const { error: deleteMembersError } = await supabase
      .from("members")
      .delete()
      .not("id", "is", null); // Delete all rows

    if (deleteMembersError) throw deleteMembersError;

    return NextResponse.json({ success: true, message: "Database wiped successfully" }, { status: 200 });
  } catch (error) {
    console.error("Failed to wipe database:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}