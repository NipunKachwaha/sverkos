import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

/**
 * Determines the number of included requests based on environment variables.
 * Defaults to 100 if not set.
 */
function includedRequests(): number {
  const fromEnv = process.env.OPENAI_PROXY_INCLUDED_REQUESTS;
  return fromEnv ? Number(fromEnv) : 100;
}

/**
 * Checks if the proxy feature is enabled in the environment.
 */
function openaiProxyEnabled(): boolean {
  return process.env.OPENAI_PROXY_ENABLED === "1";
}

// POST: Issue or retrieve an OpenAI Proxy Token
export async function POST() {
  try {
    if (!openaiProxyEnabled()) {
      return NextResponse.json({ error: "Convex OpenAI proxy is disabled." }, { status: 400 });
    }

    // 1. Authenticate user via Clerk
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Find the internal member ID from Supabase
    const { data: member, error: memberError } = await supabase
      .from("members")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (memberError || !member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // 3. Check if a token already exists for this member
    // Note: You must create a 'member_openai_tokens' table in Supabase
    const { data: existingToken } = await supabase
      .from("member_openai_tokens")
      .select("token")
      .eq("member_id", member.id)
      .single();

    if (existingToken) {
      return NextResponse.json({ token: existingToken.token }, { status: 200 });
    }

    // 4. Generate a new token and save it to Supabase
    const newToken = crypto.randomUUID();
    const { error: insertError } = await supabase
      .from("member_openai_tokens")
      .insert({
        member_id: member.id,
        token: newToken,
        requests_remaining: includedRequests(),
        last_used_time: 0,
      });

    if (insertError) throw insertError;

    return NextResponse.json({ token: newToken }, { status: 200 });

  } catch (error) {
    console.error("Error issuing OpenAI token:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}