import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import crypto from "crypto";

// POST: Create a shareable link for a chat
export async function POST(req: Request) {
  try {
    // 1. Ensure the user is authenticated
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId } = await req.json();
    if (!chatId) {
      return NextResponse.json({ error: "Missing chatId" }, { status: 400 });
    }

    // 2. Fetch the chat to ensure the current user owns it
    const { data: member } = await supabase
      .from("members")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    const { data: session } = await supabase
      .from("sessions")
      .select("id")
      .eq("member_id", member?.id)
      .single();

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 401 });
    }

    const { data: chat, error: fetchError } = await supabase
      .from("chats")
      .select("id, url_id, creator_id")
      .eq("id", chatId)
      .single();

    if (fetchError || !chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    if (chat.creator_id !== session.id) {
      return NextResponse.json({ error: "Forbidden. You do not own this chat." }, { status: 403 });
    }

    // 3. If the chat already has a share URL, return it
    if (chat.url_id) {
      return NextResponse.json({ urlId: chat.url_id }, { status: 200 });
    }

    // 4. Generate a unique short ID for sharing (e.g., 10 characters)
    const newUrlId = crypto.randomBytes(5).toString("hex");

    // 5. Update the chat with the new share URL ID
    const { error: updateError } = await supabase
      .from("chats")
      .update({ url_id: newUrlId })
      .eq("id", chatId);

    if (updateError) throw updateError;

    return NextResponse.json({ urlId: newUrlId }, { status: 200 });

  } catch (error) {
    console.error("Error creating share link:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}