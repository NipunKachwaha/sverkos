import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import crypto from "crypto";

// GET: Fetch current social share settings for a specific chat
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get("chatId");

    if (!chatId) return NextResponse.json({ error: "Missing chatId" }, { status: 400 });

    const { data: socialShare } = await supabase
      .from("social_shares")
      .select("shared, allow_fork_from_latest, code, thumbnail_url, referral_code")
      .eq("chat_id", chatId)
      .single();

    if (!socialShare) return NextResponse.json({ share: null }, { status: 200 });

    return NextResponse.json({ share: socialShare }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST: Create or update a social share record
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { chatId, shared, allowForkFromLatest, referralCode, thumbnailUrl } = body;

    if (!chatId) return NextResponse.json({ error: "Missing chatId" }, { status: 400 });

    // Validate referral code
    if (referralCode && !/^[a-zA-Z0-9_-]+$/.test(referralCode)) {
      return NextResponse.json({ error: "Invalid referral code" }, { status: 400 });
    }

    // Verify ownership
    const { data: member } = await supabase.from("members").select("id").eq("clerk_id", userId).single();
    const { data: session } = await supabase.from("sessions").select("id").eq("member_id", member?.id).single();
    
    const { data: chat } = await supabase
      .from("chats")
      .select("id")
      .eq("id", chatId)
      .eq("creator_id", session?.id)
      .single();

    if (!chat) return NextResponse.json({ error: "Chat not found or access denied" }, { status: 404 });

    // Check if share already exists
    const { data: existing } = await supabase
      .from("social_shares")
      .select("id, code")
      .eq("chat_id", chatId)
      .single();

    if (!existing) {
      // Create new share
      const code = crypto.randomBytes(4).toString("hex"); // Generate short code
      const { error: insertError } = await supabase.from("social_shares").insert({
        chat_id: chatId,
        code,
        shared: shared || "noPreferenceExpressed",
        link_to_deployed: true,
        allow_fork_from_latest: !!allowForkFromLatest,
        allow_show_in_gallery: false,
        referral_code: referralCode,
        thumbnail_url: thumbnailUrl,
      });
      if (insertError) throw insertError;
      return NextResponse.json({ code }, { status: 200 });
    } else {
      // Update existing share
      const updateData: any = {};
      if (shared) updateData.shared = shared;
      if (allowForkFromLatest !== undefined) updateData.allow_fork_from_latest = allowForkFromLatest;
      if (referralCode !== undefined) updateData.referral_code = referralCode;
      if (thumbnailUrl !== undefined) updateData.thumbnail_url = thumbnailUrl;

      const { error: updateError } = await supabase
        .from("social_shares")
        .update(updateData)
        .eq("id", existing.id);

      if (updateError) throw updateError;
      return NextResponse.json({ code: existing.code }, { status: 200 });
    }
  } catch (error) {
    console.error("Social Share Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}