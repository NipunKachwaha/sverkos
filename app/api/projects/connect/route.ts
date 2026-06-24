import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { action, chatId, deploymentData } = body;

    if (!chatId) {
      return NextResponse.json({ error: "Missing chatId" }, { status: 400 });
    }

    if (action === "disconnect") {
      // Clear deployment data from the chat
      const { error } = await supabase
        .from("chats")
        .update({
          convex_project_kind: null,
          project_slug: null,
          team_slug: null,
          deployment_url: null,
          deployment_name: null,
        })
        .eq("id", chatId);

      if (error) throw error;
      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (action === "connect") {
      // NOTE: In the future, this is where you would call the Vercel API
      // to provision a new project before updating the database.
      
      const { error } = await supabase
        .from("chats")
        .update({
          convex_project_kind: "connected",
          project_slug: deploymentData?.projectSlug || "my-app",
          team_slug: deploymentData?.teamSlug || "default-team",
          deployment_url: deploymentData?.deploymentUrl || "https://myapp.vercel.app",
          deployment_name: deploymentData?.deploymentName || "My App",
        })
        .eq("id", chatId);

      if (error) throw error;
      return NextResponse.json({ success: true }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Error managing project connection:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}