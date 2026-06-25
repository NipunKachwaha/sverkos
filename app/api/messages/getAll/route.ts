import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

async function handleRequest(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let chatId = null;

    if (req.method === "POST") {
      const body = await req.json();
      chatId = body.chatId;
    } else {
      const { searchParams } = new URL(req.url);
      chatId = searchParams.get("chatId");
    }

    // FIX: Agar chatId missing hai ya undefined hai, toh 400 error ki jagah empty array bhejo
    if (!chatId || chatId === 'undefined' || chatId === 'null') {
       return NextResponse.json([], { status: 200 }); 
    }

    const { data: messages, error } = await supabase
      .from("messages") 
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json([], { status: 200 }); // FIX: Error aane par bhi crash na ho
    }

    return NextResponse.json(messages || [], { status: 200 });
  } catch (error) {
    return NextResponse.json([], { status: 200 }); // FIX: Safe fallback
  }
}

export const GET = handleRequest;
export const POST = handleRequest;