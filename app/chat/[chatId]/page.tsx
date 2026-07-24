import ChatLayout from "@/components/ChatLayout";

import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { getMessagesByChatId } from "@/lib/db/messages";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import type { UIMessage } from "ai";

type Props = {
  params: Promise<{
    chatId: string;
  }>;
};

const ChatPage = async ({ params }: Props) => {
  const { chatId } = await params;
  const parsedChatId = Number(chatId);

  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  if (!Number.isInteger(parsedChatId)) {
    redirect("/");
  }

  const userChats = await db
    .select()
    .from(chats)
    .where(eq(chats.userId, userId));

  const currentChat = userChats.find(
    (chat) => chat.id === parsedChatId,
  );

  if (!currentChat) {
    redirect("/");
  }

  const savedMessages =
    await getMessagesByChatId(parsedChatId);

  const initialMessages: UIMessage[] = savedMessages.map(
    (message) => ({
      id: String(message.id),
      role: message.role,
      parts: [
        {
          type: "text",
          text: message.content,
        },
      ],
    }),
  );

  return (
    <ChatLayout
      chats={userChats}
      chatId={parsedChatId}
      pdfUrl={currentChat.pdfUrl}
      initialMessages={initialMessages}
    />
  );
};

export default ChatPage;