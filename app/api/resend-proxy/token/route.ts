import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server"; // Using currentUser to get the email address
import { supabase } from "@/lib/supabase";

/**
 * Checks if the proxy feature is enabled in the environment.
 */
function resendProxyEnabled(): boolean {
  return process.env.RESEND_PROXY_ENABLED === "1";
}

/**
 * Determines the number of included requests based on environment variables.
 * Defaults to 100 if not set.
 */
function includedRequests(): number {
  const fromEnv = process.env.RESEND_INCLUDED_REQUESTS;
  return fromEnv ? parseInt(fromEnv, 10) : 100;
}

// POST: Issue or retrieve a Resend Proxy Token
export async function POST() {
  try {
    if (!resendProxyEnabled()) {
      return NextResponse.json({ error: "Convex Resend proxy is disabled." }, { status: 400 });
    }

    // 1. Authenticate user and get their verified email via Clerk
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const primaryEmailObj = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId);
    if (!primaryEmailObj) {
      return NextResponse.json({ error: "User has no verified email" }, { status: 403 });
    }
    const verifiedEmail = primaryEmailObj.emailAddress;

    // 2. Find the internal member ID from Supabase
    const { data: member, error: memberError } = await supabase
      .from("members")
      .select("id")
      .eq("clerk_id", user.id)
      .single();

    if (memberError || !member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // 3. Check if a token already exists for this member
    // Note: You must create a 'resend_tokens' table in Supabase
    const { data: existingToken } = await supabase
      .from("resend_tokens")
      .select("*")
      .eq("member_id", member.id)
      .single();

    if (existingToken) {
      // Update the verified email if it has changed in Clerk
      if (existingToken.verified_email !== verifiedEmail) {
        await supabase
          .from("resend_tokens")
          .update({ verified_email: verifiedEmail })
          .eq("id", existingToken.id);
      }
      return NextResponse.json({ token: existingToken.token }, { status: 200 });
    }

    // 4. Generate a new token and save it to Supabase
    const newToken = crypto.randomUUID();
    const { error: insertError } = await supabase
      .from("resend_tokens")
      .insert({
        member_id: member.id,
        token: newToken,
        verified_email: verifiedEmail,
        requests_remaining: includedRequests(),
        last_used_time: 0,
      });

    if (insertError) throw insertError;

    return NextResponse.json({ token: newToken }, { status: 200 });

  } catch (error) {
    console.error("Error issuing Resend token:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}