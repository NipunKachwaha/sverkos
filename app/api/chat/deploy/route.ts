import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

// GET: Check if a chat has been deployed (Replaces 'hasBeenDeployed' query)
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Extract chatId from the URL query parameters
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get("chatId");

    if (!chatId) {
      return NextResponse.json({ error: "Missing chatId parameter" }, { status: 400 });
    }

    // Fetch the deployment status from the chats table
    const { data: chat, error } = await supabase
      .from("chats")
      .select("has_been_deployed")
      .eq("id", chatId)
      .single();

    if (error || !chat) {
      return NextResponse.json({ isDeployed: false }, { status: 200 });
    }

    return NextResponse.json({ isDeployed: !!chat.has_been_deployed }, { status: 200 });

  } catch (error) {
    console.error("Error fetching deployment status:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST: Mark a chat as deployed (Replaces 'recordDeploy' mutation)
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId } = await req.json();

    if (!chatId) {
      return NextResponse.json({ error: "Missing chatId in request body" }, { status: 400 });
    }

    // Update the chat record to indicate it has been deployed
    const { error } = await supabase
      .from("chats")
      .update({ has_been_deployed: true })
      .eq("id", chatId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("Error recording deployment:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}