import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

// POST: Store chat messages blob and snapshot blob to Supabase Storage
export async function POST(req: Request) {
  try {
    // 1. Authenticate the user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse the FormData (Replaces the Convex HTTP action parsing)
    const formData = await req.formData();
    const chatId = formData.get("chatId") as string;
    const lastMessageRank = parseInt((formData.get("lastMessageRank") as string) || "-1", 10);
    const subchatIndex = parseInt((formData.get("lastSubchatIndex") as string) || "0", 10);
    const partIndex = parseInt((formData.get("partIndex") as string) || "-1", 10);
    
    // 3. Verify access to the chat
    const { data: member } = await supabase.from("members").select("id").eq("clerk_id", userId).single();
    const { data: session } = await supabase.from("sessions").select("id").eq("member_id", member?.id).single();

    const { data: chat, error: chatError } = await supabase
      .from("chats")
      .select("id")
      .eq("id", chatId)
      .eq("creator_id", session?.id)
      .single();

    if (chatError || !chat) {
      return NextResponse.json({ error: "Chat not found or unauthorized" }, { status: 404 });
    }

    // 4. Upload Messages Blob (if provided)
    const messagesBlob = formData.get("messages") as Blob | null;
    let storageId = null;
    if (messagesBlob) {
      const fileName = `messages_${Date.now()}_${Math.random().toString(36).substring(7)}.gz`;
      const filePath = `${chat.id}/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from("chat_history") // Ensure this bucket exists in your Supabase
        .upload(filePath, messagesBlob, { contentType: messagesBlob.type });
        
      if (!error && data) storageId = data.path;
    }

    // 5. Upload Snapshot Blob (if provided)
    const snapshotBlob = formData.get("snapshot") as Blob | null;
    let snapshotId = null;
    if (snapshotBlob) {
      const fileName = `snapshot_${Date.now()}_${Math.random().toString(36).substring(7)}.zip`;
      const filePath = `${chat.id}/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from("project_snapshots") // Ensure this bucket exists in your Supabase
        .upload(filePath, snapshotBlob, { contentType: snapshotBlob.type });
        
      if (!error && data) snapshotId = data.path;
    }

    // 6. Record the storage state in the database
    // This replaces the old updateStorageState internal mutation
    const { error: dbError } = await supabase
      .from("chat_messages_storage_state")
      .insert({
        chat_id: chat.id,
        subchat_index: subchatIndex,
        last_message_rank: lastMessageRank,
        part_index: partIndex,
        storage_id: storageId,
        snapshot_id: snapshotId,
      });

    if (dbError) throw dbError;

    // Note: The 'firstMessage' summary logic that was here in Convex 
    // should now be called by the frontend directly hitting /api/summarize

    return NextResponse.json({ success: true, storageId, snapshotId }, { status: 200 });

  } catch (error) {
    console.error("Error storing chat:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}