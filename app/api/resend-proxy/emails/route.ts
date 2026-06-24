import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { resendRateLimiter } from "@/lib/rateLimiter"; // Assuming you created this from the previous step

function resendProxyEnabled(): boolean {
  return process.env.RESEND_PROXY_ENABLED === "1";
}

// POST: Proxy the request to Resend API and enforce rate limits & quotas
export async function POST(req: Request) {
  try {
    if (!resendProxyEnabled()) {
      return NextResponse.json({ error: "Convex Resend proxy is disabled." }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "RESEND_API_KEY is not set" }, { status: 500 });
    }

    // 1. Parse and validate the request body
    const body = await req.json();

    let recipientEmail: string;
    if (typeof body.to === "string") {
      recipientEmail = body.to;
    } else {
      if (!Array.isArray(body.to) || body.to.length !== 1) {
        return NextResponse.json({ error: "Convex Resend proxy only supports one recipient." }, { status: 400 });
      }
      recipientEmail = body.to[0];
    }

    if (body.bcc || body.cc) {
      return NextResponse.json({ error: "Convex Resend proxy does not support bcc or cc." }, { status: 400 });
    }
    if (body.scheduled_at || body.headers) {
      return NextResponse.json({ error: "Convex Resend proxy does not support scheduled emails or custom headers." }, { status: 400 });
    }

    // 2. Verify Authorization Header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Invalid authorization header" }, { status: 401 });
    }
    const tokenStr = authHeader.slice(7);

    // 3. Validate Token and Decrement Quota (Replaces decrementToken mutation)
    const { data: tokenRecord, error: tokenError } = await supabase
      .from("resend_tokens")
      .select("*")
      .eq("token", tokenStr)
      .single();

    if (tokenError || !tokenRecord) {
      return NextResponse.json({ error: "Invalid RESEND_API_TOKEN" }, { status: 401 });
    }

    if (tokenRecord.requests_remaining <= 0) {
      return NextResponse.json({ error: "Resend API token has no requests remaining." }, { status: 403 });
    }

    if (tokenRecord.verified_email !== recipientEmail) {
      return NextResponse.json({ 
        error: `The Proxy only supports sending email to your own verified email address (${tokenRecord.verified_email}).` 
      }, { status: 403 });
    }

    // Deduct 1 request and update last used time
    await supabase
      .from("resend_tokens")
      .update({
        requests_remaining: tokenRecord.requests_remaining - 1,
        last_used_time: Date.now(),
      })
      .eq("id", tokenRecord.id);

    // 4. Enforce Upstash Rate Limiting
    const { success, reset } = await resendRateLimiter.limit(tokenStr); // Rate limit based on the unique token
    if (!success) {
      return NextResponse.json(
        { error: "Rate limit exceeded" }, 
        { status: 429, headers: { "X-RateLimit-Reset": reset.toString() } }
      );
    }

    // 5. Send the email via Resend
    const deploymentName = process.env.NEXT_PUBLIC_APP_URL?.replace("https://", "") || "MyApp";
    
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Notifications <admin@${deploymentName}>`, // Ensure you have a verified domain in Resend
        to: recipientEmail,
        subject: body.subject,
        html: body.html,
        reply_to: body.reply_to,
        text: body.text,
        attachments: body.attachments,
        tags: body.tags,
      }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: responseData }, { status: response.status });
    }

    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    console.error("Resend Proxy Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}