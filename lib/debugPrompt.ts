import { supabase } from "@/lib/supabase"; // Ensure this uses your Service Role Key

export async function storeDebugPrompt(args: {
  chatId: string;
  responseCoreMessages: any[];
  promptCoreMessagesStorageUrl: string; // Replaces Convex storage ID
  finishReason: string;
  modelId?: string;
  usage: any;
  chefTokens: number;
}) {
  try {
    // 1. Fetch the chat to get the last_subchat_index (Replacing getChatByInitialId)
    const { data: chat, error: chatError } = await supabase
      .from("chats")
      .select("id, last_subchat_index")
      .eq("id", args.chatId)
      .single();

    if (chatError || !chat) throw new Error("Chat not found");

    // 2. Insert the debug log into Supabase
    // Note: You will need to add a 'debug_chat_api_request_log' table to your Supabase schema
    const { error } = await supabase.from("debug_chat_api_request_log").insert({
      chat_id: chat.id,
      subchat_index: chat.last_subchat_index,
      response_core_messages: args.responseCoreMessages,
      prompt_core_messages_storage_url: args.promptCoreMessagesStorageUrl,
      finish_reason: args.finishReason,
      model_id: args.modelId ?? "",
      usage: args.usage,
      chef_tokens: args.chefTokens,
    });

    if (error) {
      console.error("Failed to insert debug prompt:", error);
    }
  } catch (error) {
    console.error("Error in storeDebugPrompt utility:", error);
  }
}