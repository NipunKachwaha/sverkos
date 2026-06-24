import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { chatId, subchatIndex, lastMessageRank } = await req.json();

    if (!chatId || lastMessageRank === undefined) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // 1. Update the chat to point to the rewound index and rank
    const { error: chatError } = await supabase
      .from("chats")
      .update({
        last_subchat_index: subchatIndex || 0,
        last_message_rank: lastMessageRank,
      })
      .eq("id", chatId);

    if (chatError) throw chatError;

    // 2. Delete any message storage states that occurred AFTER this rewind point
    const { error: cleanupError } = await supabase
      .from("chat_messages_storage_state")
      .delete()
      .eq("chat_id", chatId)
      .eq("subchat_index", subchatIndex || 0)
      .gt("last_message_rank", lastMessageRank);

    if (cleanupError) console.error("Cleanup error (non-fatal):", cleanupError);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error rewinding chat:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}