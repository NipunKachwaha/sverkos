import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

// GET: Fetch a specific chat by ID
export async function GET(req: Request, { params }: { params: { chatId: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: chat, error } = await supabase
      .from("chats")
      .select("*")
      .eq("id", params.chatId)
      .neq("is_deleted", true)
      .single();

    if (error || !chat) return NextResponse.json({ error: "Chat not found" }, { status: 404 });

    return NextResponse.json({ chat }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PATCH: Update chat description or urlId
export async function PATCH(req: Request, { params }: { params: { chatId: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const updateData: any = {};
    if (body.description) updateData.description = body.description;
    if (body.urlId) updateData.url_id = body.urlId;

    const { error } = await supabase
      .from("chats")
      .update(updateData)
      .eq("id", params.chatId);

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE: Soft delete a chat
export async function DELETE(req: Request, { params }: { params: { chatId: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { error } = await supabase
      .from("chats")
      .update({ is_deleted: true })
      .eq("id", params.chatId);

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}