import { NextResponse } from "next/server";
import { assertIsAdmin } from "@/lib/admin"; // The helper we created earlier
import { supabase } from "@/lib/supabase";

// GET: Fetch debug prompts for a specific chat (Replaces 'show' query)
export async function GET(req: Request) {
  try {
    // 1. Verify that the user is an Admin
    await assertIsAdmin();

    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get("chatId");

    if (!chatId) {
      return NextResponse.json({ error: "Missing chatId" }, { status: 400 });
    }

    // 2. Fetch the debug logs for this chat
    const { data: debugPrompts, error } = await supabase
      .from("debug_chat_api_request_log")
      .select("*")
      .eq("chat_id", chatId);

    if (error) throw error;

    return NextResponse.json({ debugPrompts }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching debug prompts:", error);
    const status = error.message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

// DELETE: Delete a specific debug prompt, or delete all of them
export async function DELETE(req: Request) {
  try {
    // 1. Verify that the user is an Admin
    await assertIsAdmin();

    const { searchParams } = new URL(req.url);
    const logId = searchParams.get("logId");
    const deleteAll = searchParams.get("deleteAll") === "true";

    // 2. Handle 'deleteAllDebugPrompts' logic
    if (deleteAll) {
      // Supabase trick to delete all rows: filter where ID is not null
      const { error } = await supabase
        .from("debug_chat_api_request_log")
        .delete()
        .not("id", "is", null); 
        
      if (error) throw error;
      return NextResponse.json({ success: true, message: "All debug logs deleted" }, { status: 200 });
    }

    // 3. Handle specific 'deleteDebugPrompt' logic
    if (!logId) {
      return NextResponse.json({ error: "Missing logId" }, { status: 400 });
    }

    const { error } = await supabase
      .from("debug_chat_api_request_log")
      .delete()
      .eq("id", logId);

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting debug prompts:", error);
    const status = error.message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}