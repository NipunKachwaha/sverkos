import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

// POST: Save the snapshot information after successful upload
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId, storagePath } = await req.json();

    if (!chatId || !storagePath) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Verify the chat belongs to the user via their session
    const { data: member } = await supabase.from("members").select("id").eq("clerk_id", userId).single();
    const { data: session } = await supabase.from("sessions").select("id").eq("member_id", member?.id).single();

    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 401 });

    const { data: chat, error: chatError } = await supabase
      .from("chats")
      .select("id")
      .eq("id", chatId)
      .eq("creator_id", session.id)
      .single();

    if (chatError || !chat) {
      return NextResponse.json({ error: "Chat not found or access denied" }, { status: 404 });
    }

    // 2. Update the chat with the new snapshot storage path
    const { error: updateError } = await supabase
      .from("chats")
      .update({ snapshot_id: storagePath }) // Using storagePath as the snapshot_id
      .eq("id", chat.id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error saving snapshot:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// GET: Retrieve the URL for a chat's snapshot
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get("chatId");

    if (!chatId) {
      return NextResponse.json({ error: "Missing chatId" }, { status: 400 });
    }

    // 1. Verify access and fetch the chat
    const { data: member } = await supabase.from("members").select("id").eq("clerk_id", userId).single();
    const { data: session } = await supabase.from("sessions").select("id").eq("member_id", member?.id).single();

    const { data: chat, error: chatError } = await supabase
      .from("chats")
      .select("id, snapshot_id, last_subchat_index")
      .eq("id", chatId)
      .eq("creator_id", session?.id)
      .single();

    if (chatError || !chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // 2. Try to get the snapshot from the latest storage state
    const { data: latestStorageState } = await supabase
      .from("chat_messages_storage_state")
      .select("snapshot_id")
      .eq("chat_id", chat.id)
      .eq("subchat_index", chat.last_subchat_index || 0)
      .order("last_message_rank", { ascending: false })
      .limit(1)
      .single();

    const targetSnapshotId = latestStorageState?.snapshot_id || chat.snapshot_id;

    if (!targetSnapshotId) {
      return NextResponse.json({ url: null }, { status: 200 }); // No snapshot exists
    }

    // 3. Generate the Supabase Storage URL
    // Replace 'project_snapshots' with your actual Supabase bucket name
    const { data: urlData } = supabase
      .storage
      .from('project_snapshots')
      .getPublicUrl(targetSnapshotId);

    return NextResponse.json({ url: urlData.publicUrl }, { status: 200 });
  } catch (error) {
    console.error("Error fetching snapshot URL:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}