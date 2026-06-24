import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET: Fetch public metadata for a shared chat by its code
export async function GET(
  req: Request,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;

    if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

    // 1. Fetch the social share record
    const { data: socialShare, error: shareError } = await supabase
      .from("social_shares")
      .select("*")
      .eq("code", code)
      .single();

    if (shareError || !socialShare) {
      // Fallback: Check if it's a regular share (like getSocialShareOrIsSnapshotShare did)
      const { data: regularShare } = await supabase.from("chats").select("id").eq("url_id", code).single();
      if (regularShare) {
        return NextResponse.json({ isSnapshotShare: true }, { status: 200 });
      }
      return NextResponse.json({ error: "Invalid share link" }, { status: 404 });
    }

    // 2. Fetch the associated chat
    const { data: chat, error: chatError } = await supabase
      .from("chats")
      .select("id, description, has_been_deployed, deployment_name, creator_id")
      .eq("id", socialShare.chat_id)
      .single();

    if (chatError || !chat) {
      return NextResponse.json({ error: "Chat no longer exists" }, { status: 404 });
    }

    // 3. Fetch author profile
    const { data: session } = await supabase.from("sessions").select("member_id").eq("id", chat.creator_id).single();
    const { data: member } = await supabase.from("members").select("username, avatar_url").eq("id", session?.member_id).single();

    // 4. Construct deployment URL if applicable
    const deployedUrl = (chat.has_been_deployed && chat.deployment_name)
      ? `https://${chat.deployment_name}.vercel.app` // Adjusted for generic hosting
      : null;

    return NextResponse.json({
      description: chat.description || null,
      code,
      shared: socialShare.shared,
      allowShowInGallery: socialShare.allow_show_in_gallery,
      hasBeenDeployed: !!chat.has_been_deployed,
      deployedUrl,
      thumbnailUrl: socialShare.thumbnail_url || null,
      referralCode: socialShare.referral_code || null,
      author: member ? {
        username: member.username,
        avatar: member.avatar_url,
      } : null,
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching social share:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}