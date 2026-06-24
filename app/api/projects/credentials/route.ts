import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Extract chatId from URL search params
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get("chatId");

    if (!chatId) {
      return NextResponse.json({ error: "Missing chatId" }, { status: 400 });
    }

    // Fetch deployment details from the chats table
    const { data: chat, error } = await supabase
      .from("chats")
      .select("convex_project_kind, project_slug, team_slug, deployment_url, deployment_name")
      .eq("id", chatId)
      .single();

    if (error || !chat) {
      return NextResponse.json({ project: null }, { status: 200 });
    }

    // Return the status in the format the frontend expects
    if (!chat.convex_project_kind) {
      return NextResponse.json({ project: null }, { status: 200 });
    }

    return NextResponse.json({
      project: {
        kind: chat.convex_project_kind, // 'connected', 'connecting', or 'failed'
        projectSlug: chat.project_slug,
        teamSlug: chat.team_slug,
        deploymentUrl: chat.deployment_url,
        deploymentName: chat.deployment_name,
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching project credentials:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}