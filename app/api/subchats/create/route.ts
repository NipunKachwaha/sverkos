import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase"; // Aapka Supabase client

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Frontend se chatId aur sessionId receive kar rahe hain
    const { chatId, sessionId } = await req.json();

    if (!chatId || !sessionId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Current chat ka data nikalte hain taaki last subchat index pata chale
    const { data: chat, error: fetchError } = await supabase
      .from("chats")
      .select("last_subchat_index")
      .eq("id", chatId)
      .single();

    if (fetchError) {
      console.error("Chat fetch error:", fetchError);
      throw fetchError;
    }

    // 2. Naya subchat index calculate karte hain (purane wale mein +1)
    const newSubchatIndex = (chat.last_subchat_index || 0) + 1;

    // 3. Chat table ko naye subchat index ke sath update kar dete hain
    const { error: updateError } = await supabase
      .from("chats")
      .update({ last_subchat_index: newSubchatIndex })
      .eq("id", chatId);

    if (updateError) throw updateError;

    // 4. Frontend ko naya index bhej dete hain
    return NextResponse.json(newSubchatIndex, { status: 200 });

  } catch (error) {
    console.error("Error creating subchat:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}