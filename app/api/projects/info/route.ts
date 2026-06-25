import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get("chatId");

    if (!chatId || chatId === 'undefined' || chatId === 'null') {
      return NextResponse.json(null, { status: 200 }); // FIX: Return null instead of error
    }

    const { data: chat, error } = await supabase
      .from("chats")
      .select("id, description, has_been_deployed, deployment_name")
      .eq("id", chatId)
      .single();

    if (error || !chat) {
      return NextResponse.json(null, { status: 200 }); // FIX: 404 ki jagah null bhejo taaki app chalti rahe
    }

    return NextResponse.json(chat, { status: 200 });
  } catch (error) {
    return NextResponse.json(null, { status: 200 });
  }
}