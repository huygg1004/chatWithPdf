import { asc, eq } from "drizzle-orm";

import { db } from "./index";
import { messages } from "./schema";

export async function saveMessage({
  chatId,
  content,
  role,
}: {
  chatId: number;
  content: string;
  role: "user" | "assistant" | "system";
}) {
  await db.insert(messages).values({
    chatId,
    content,
    role,
  });
}

export async function getMessagesByChatId(chatId: number) {
  return await db
    .select()
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(asc(messages.createdAt), asc(messages.id));
}