import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

// POST: Fetch the initial messages blob for a chat
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { chatId, subchatIndex = 0 } = await req.json();

    const { data: storageState } = await supabase
      .from("chat_messages_storage_state")
      .select("storage_id")
      .eq("chat_id", chatId)
      .eq("subchat_index", subchatIndex)
      .order("last_message_rank", { ascending: false })
      .limit(1)
      .single();

    if (!storageState?.storage_id) {
      return new NextResponse(null, { status: 204 }); // No content
    }

    // Generate a signed URL or download the blob directly from Supabase Storage
    const { data, error } = await supabase.storage
      .from("chat_history")
      .download(storageState.storage_id);

    if (error || !data) throw error;

    return new NextResponse(data, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}