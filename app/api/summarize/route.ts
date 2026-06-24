import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import OpenAI from "openai";

const SUMMARIZE_SYSTEM_PROMPT = `You are a helpful assistant that given a users' prompt, summarizes it into 5 words
or less. These summaries should be a short description of the feature/bug a user is trying to work on.
You should not include any punctuation in your summaries. Always capitalize the first letter of your summary
and the rest of the summary should be lowercase. Here are a few examples of good summaries:
#1
User's prompt: "Create a nice landing page for the notion clone that has a clear CTA and hero section."
Summary: "Update landing page"
#2
User's prompt: "Fix bug where the slack chat won't auto-scroll to the bottom when a new message is sent."
Summary: "Fix auto-scroll bug"
#3
User's prompt: "Build a simple splitwise clone that has groups and allows users to split expenses."
Summary: "Splitwise clone"`;

// POST: Generate summary via OpenAI and save to Supabase
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { storageStateId, message } = await req.json();

    if (!storageStateId || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // 2. Call OpenAI to generate the summary
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini", // Keeping the exact model from your original code
      messages: [
        {
          role: "system",
          content: SUMMARIZE_SYSTEM_PROMPT,
        },
        { role: "user", content: message },
      ],
    });

    const summary = response.choices[0]?.message?.content?.trim();

    if (!summary) {
      throw new Error("Failed to summarize message");
    }

    // 3. Save the summary to the specific storage state in Supabase
    // This replaces the old saveMessageSummary internal mutation
    const { error: updateError } = await supabase
      .from("chat_messages_storage_state")
      .update({ description: summary })
      .eq("id", storageStateId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ summary, success: true }, { status: 200 });

  } catch (error) {
    console.error("Error summarizing message:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}