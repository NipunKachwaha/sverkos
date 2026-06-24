import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const ALLOWED_MODELS = ["gpt-4o-mini", "gpt-4.1-nano"];

function openaiProxyEnabled(): boolean {
  return process.env.OPENAI_PROXY_ENABLED === "1";
}

// POST: Proxy the request to OpenAI and decrement token usage
export async function POST(req: Request) {
  if (!openaiProxyEnabled()) {
    return new Response("Convex OpenAI proxy is disabled.", { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return new Response("OPENAI_API_KEY is not set", { status: 500 });
  }

  // 1. Verify Authorization Header
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response("Invalid or missing authorization header", { status: 401 });
  }

  const tokenStr = authHeader.slice(7);

  // 2. Validate token and decrement requests (Replaces internal decrementToken mutation)
  const { data: tokenRecord, error: tokenError } = await supabase
    .from("member_openai_tokens")
    .select("*")
    .eq("token", tokenStr)
    .single();

  if (tokenError || !tokenRecord) {
    return new Response("Invalid OPENAI_API_TOKEN", { status: 401 });
  }

  if (tokenRecord.requests_remaining <= 0) {
    return new Response(
      "OPENAI_API_TOKEN has no requests remaining. Go sign up for an OpenAI API key at https://platform.openai.com.",
      { status: 401 }
    );
  }

  // Deduct 1 request and update last used time
  await supabase
    .from("member_openai_tokens")
    .update({
      requests_remaining: tokenRecord.requests_remaining - 1,
      last_used_time: Date.now(),
    })
    .eq("id", tokenRecord.id);

  // 3. Parse and Validate the Request Body
  let body: any;
  try {
    body = await req.json();
  } catch (_error) {
    return new Response("Invalid request body", { status: 400 });
  }

  if (!ALLOWED_MODELS.includes(body.model)) {
    return new Response(`Only ${ALLOWED_MODELS.join(" and ")} are supported`, { status: 400 });
  }

  if (body.max_completion_tokens && body.max_completion_tokens > 16384) {
    return new Response("max_completion_tokens must be <= 16384", { status: 400 });
  }
  if (body.max_tokens && body.max_tokens > 16384) {
    return new Response("max_tokens must be <= 16384", { status: 400 });
  }
  if (body.service_tier !== undefined || body.store !== undefined || body.web_search_options !== undefined) {
    return new Response("service_tier, store, and web_search_options are not supported", { status: 400 });
  }

  // 4. Construct the sanitized proxy body
  const proxiedBody = {
    messages: body.messages,
    model: body.model,
    audio: body.audio,
    frequency_penalty: body.frequency_penalty,
    function_call: body.function_call,
    functions: body.functions,
    logit_bias: body.logit_bias,
    logprobs: body.logprobs,
    max_completion_tokens: body.max_completion_tokens,
    max_tokens: body.max_tokens,
    metadata: body.metadata,
    modalities: body.modalities,
    n: body.n,
    parallel_tool_calls: body.parallel_tool_calls,
    prediction: body.prediction,
    presence_penalty: body.presence_penalty,
    reasoning_effort: body.reasoning_effort,
    response_format: body.response_format,
    seed: body.seed,
    stop: body.stop,
    stream: body.stream,
    stream_options: body.stream_options,
    temperature: body.temperature,
    tool_choice: body.tool_choice,
    tools: body.tools,
    top_logprobs: body.top_logprobs,
    top_p: body.top_p,
    user: body.user,
  };

  // 5. Forward the request to OpenAI
  // Since fetch returns a Response object (which includes the data stream),
  // we can directly return this from our Next.js API route to support streaming automatically!
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify(proxiedBody),
  });

  return response;
}