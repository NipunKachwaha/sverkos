import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

const MAX_SUBCHATS = parseInt(process.env.MAX_SUBCHATS ?? "600", 10);

// GET: Fetch all subchats for a specific chat
export async function GET(
  req: Request,
  { params }: { params: { chatId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId } = params;
    if (!chatId) {
      return NextResponse.json({ error: "Missing chatId" }, { status: 400 });
    }

    // 1. Verify access to the chat
    const { data: member } = await supabase.from("members").select("id").eq("clerk_id", userId).single();
    const { data: session } = await supabase.from("sessions").select("id").eq("member_id", member?.id).single();

    const { data: chat, error: chatError } = await supabase
      .from("chats")
      .select("id, last_subchat_index")
      .eq("id", chatId)
      .eq("creator_id", session?.id)
      .single();

    if (chatError || !chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // 2. Fetch all storage states for this chat ordered by subchat and rank
    const { data: storageStates } = await supabase
      .from("chat_messages_storage_state")
      .select("subchat_index, description, created_at")
      .eq("chat_id", chat.id)
      .order("last_message_rank", { ascending: false });

    // 3. Filter to get only the latest entry per subchat
    const uniqueSubchats = new Map();
    for (const state of storageStates || []) {
      if (!uniqueSubchats.has(state.subchat_index)) {
        uniqueSubchats.set(state.subchat_index, {
          subchatIndex: state.subchat_index,
          description: state.description,
          updatedAt: new Date(state.created_at).getTime(),
        });
      }
    }

    const subchats = Array.from(uniqueSubchats.values()).sort((a, b) => a.subchatIndex - b.subchatIndex);

    return NextResponse.json(subchats, { status: 200 });
  } catch (error) {
    console.error("Error fetching subchats:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST: Create a new subchat branch
export async function POST(
  req: Request,
  { params }: { params: { chatId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId } = params;
    if (!chatId) {
      return NextResponse.json({ error: "Missing chatId" }, { status: 400 });
    }

    // 1. Verify access to the chat
    const { data: member } = await supabase.from("members").select("id").eq("clerk_id", userId).single();
    const { data: session } = await supabase.from("sessions").select("id").eq("member_id", member?.id).single();

    const { data: chat, error: chatError } = await supabase
      .from("chats")
      .select("id, last_subchat_index")
      .eq("id", chatId)
      .eq("creator_id", session?.id)
      .single();

    if (chatError || !chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    const newSubchatIndex = (chat.last_subchat_index || 0) + 1;

    if (newSubchatIndex > MAX_SUBCHATS) {
      return NextResponse.json({ 
        error: "You have reached the maximum number of subchats. You must continue the conversation in the current subchat." 
      }, { status: 400 });
    }

    // 2. Get the latest storage state of the CURRENT subchat to inherit the snapshot
    const { data: latestStorageState } = await supabase
      .from("chat_messages_storage_state")
      .select("id, snapshot_id")
      .eq("chat_id", chat.id)
      .eq("subchat_index", chat.last_subchat_index)
      .order("last_message_rank", { ascending: false })
      .limit(1)
      .single();

    // 3. Create the new subchat storage state
    const { error: insertError } = await supabase
      .from("chat_messages_storage_state")
      .insert({
        chat_id: chat.id,
        subchat_index: newSubchatIndex,
        last_message_rank: -1,
        part_index: -1,
        snapshot_id: latestStorageState?.snapshot_id || null,
      });

    if (insertError) throw insertError;

    // 4. Update the chat's last_subchat_index
    const { error: updateError } = await supabase
      .from("chats")
      .update({ last_subchat_index: newSubchatIndex })
      .eq("id", chat.id);

    if (updateError) throw updateError;

    // 5. CLEANUP: Delete all older storage states for the PREVIOUS subchat 
    //    except for the very latest one we just used as the branch point.
    if (latestStorageState?.id) {
      const { error: cleanupError } = await supabase
        .from("chat_messages_storage_state")
        .delete()
        .eq("chat_id", chat.id)
        .eq("subchat_index", chat.last_subchat_index)
        .neq("id", latestStorageState.id);
        
      if (cleanupError) {
        console.warn("Failed to cleanup old subchat states (non-fatal):", cleanupError);
      }
    }

    return NextResponse.json({ subchatIndex: newSubchatIndex }, { status: 200 });
  } catch (error) {
    console.error("Error creating subchat:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}