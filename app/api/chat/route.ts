import { openai } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  streamText,
  type UIMessage,
} from "ai";

export async function POST(req: Request) {
  try {
    const {
      messages,
      chatId,
    }: {
      messages: UIMessage[];
      chatId: number;
    } = await req.json();

    console.log("Chat request:", {
      chatId,
      messageCount: messages.length,
    });

    const result = streamText({
      model: openai("gpt-4o-mini"),
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);

    return Response.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}