import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET: Fetch a chat by its public URL ID
export async function GET(
  req: Request,
  { params }: { params: { urlId: string } }
) {
  try {
    const { urlId } = params;

    if (!urlId) {
      return NextResponse.json({ error: "Missing URL ID parameter" }, { status: 400 });
    }

    // Fetch the chat where url_id matches the public link
    // Ensure we do not fetch soft-deleted chats
    const { data: chat, error } = await supabase
      .from("chats")
      .select("id, description, timestamp, has_been_deployed, deployment_url")
      .eq("url_id", urlId)
      .neq("is_deleted", true)
      .single();

    if (error || !chat) {
      return NextResponse.json({ error: "Shared chat not found or has been deleted" }, { status: 404 });
    }

    // Optional: You might also want to fetch the messages associated with this chat
    // For now, we return the base chat details
    return NextResponse.json({ chat }, { status: 200 });

  } catch (error) {
    console.error("Error fetching shared chat:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}