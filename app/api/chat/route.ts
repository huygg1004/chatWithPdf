import { openai } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  streamText,
  type UIMessage,
} from "ai";

import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { getContext } from "@/lib/context";
import { saveMessage } from "@/lib/db/messages";

type ChatRequestBody = {
  messages: UIMessage[];
  chatId: number;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ChatRequestBody;
    const { messages, chatId } = body;

    if (!Number.isInteger(chatId)) {
      return Response.json(
        { error: "A valid chatId is required" },
        { status: 400 },
      );
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        { error: "At least one message is required" },
        { status: 400 },
      );
    }

    console.log("Chat request:", {
      chatId,
      messageCount: messages.length,
    });

    const [chat] = await db
      .select({
        id: chats.id,
        fileKey: chats.fileKey,
      })
      .from(chats)
      .where(eq(chats.id, chatId))
      .limit(1);

    if (!chat) {
      return Response.json(
        { error: "Chat not found" },
        { status: 404 },
      );
    }

    const latestUserMessage = [...messages]
      .reverse()
      .find((message) => message.role === "user");

    if (!latestUserMessage) {
      return Response.json(
        { error: "No user message found" },
        { status: 400 },
      );
    }

    const question = latestUserMessage.parts
      .filter(
        (
          part,
        ): part is Extract<
          (typeof latestUserMessage.parts)[number],
          { type: "text" }
        > => part.type === "text",
      )
      .map((part) => part.text)
      .join("\n")
      .trim();

    if (!question) {
      return Response.json(
        { error: "The user message does not contain text" },
        { status: 400 },
      );
    }

    await saveMessage({
      chatId,
      content: question,
      role: "user",
    });

    console.log("User message saved");
    console.log("Latest question:", question);
    console.log("PDF file key:", chat.fileKey);

    const context = await getContext(question, chat.fileKey);

    console.log("Retrieved PDF context length:", context.length);

    const modelMessages = await convertToModelMessages(messages);

    const result = streamText({
      model: openai("gpt-4o-mini"),

      system: `
You are an AI assistant that answers questions about an uploaded PDF.

Follow these rules:

1. Answer using only the PDF context supplied below.
2. Do not claim that you cannot access or view the PDF.
3. If the answer is not present in the context, say:
   "I couldn't find that information in the uploaded PDF."
4. Do not invent names, prices, quantities, dates, or other details.
5. When a page number is available, mention it in the answer.
6. Keep the answer clear and concise.

PDF CONTEXT:

${context || "No relevant PDF context was retrieved."}
      `.trim(),

      messages: modelMessages,
    });

    return result.toUIMessageStreamResponse({
      originalMessages: messages,

      onFinish: async ({ messages: completedMessages }) => {
        try {
          const latestAssistantMessage = [...completedMessages]
            .reverse()
            .find((message) => message.role === "assistant");

          if (!latestAssistantMessage) {
            return;
          }

          const assistantText = latestAssistantMessage.parts
            .filter(
              (
                part,
              ): part is Extract<
                (typeof latestAssistantMessage.parts)[number],
                { type: "text" }
              > => part.type === "text",
            )
            .map((part) => part.text)
            .join("\n")
            .trim();

          if (!assistantText) {
            return;
          }

          await saveMessage({
            chatId,
            content: assistantText,
            role: "assistant",
          });

          console.log("Assistant message saved");
        } catch (error) {
          console.error(
            "Failed to save assistant message:",
            error,
          );
        }
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);

    return Response.json(
      { error: "Failed to generate response" },
      { status: 500 },
    );
  }
}