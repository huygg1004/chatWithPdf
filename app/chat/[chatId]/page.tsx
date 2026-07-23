import PDFViewer from "@/components/PDFViewer";
import ChatSideBar from "@/components/ChatSideBar";
import ChatComponent from "@/components/ChatComponent";

import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

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
    (chat) => chat.id === parsedChatId
  );

  if (!currentChat) {
    redirect("/");
  }

  return (
    <div className="h-screen overflow-hidden">
      <div className="flex h-full w-full">
        {/* Sidebar */}
        <aside className="h-full w-64 shrink-0">
          <ChatSideBar
            chats={userChats}
            chatId={parsedChatId}
          />
        </aside>

        {/* PDF and chat area */}
        <main className="flex h-full min-w-0 flex-1 overflow-hidden">
          {/* PDF viewer */}
          <section className="h-full w-[88%] min-w-0 p-4">
            <PDFViewer pdf_url={currentChat.pdfUrl} />
          </section>

          {/* Chat component */}
          <section className="h-full w-[38%] min-w-0 border-l-4 border-l-slate-200">
            <ChatComponent chatId={parsedChatId} />
          </section>
        </main>
      </div>
    </div>
  );
};

export default ChatPage;