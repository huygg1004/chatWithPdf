"use client";

import {
  Group,
  Panel,
  Separator,
} from "react-resizable-panels";

import PDFViewer from "@/components/PDFViewer";
import ChatSideBar from "@/components/ChatSideBar";
import ChatComponent from "@/components/ChatComponent";

import type { chats } from "@/lib/db/schema";
import type { UIMessage } from "ai";

type Chat = typeof chats.$inferSelect;

type ChatLayoutProps = {
  chats: Chat[];
  chatId: number;
  pdfUrl: string;
  initialMessages: UIMessage[];
};

export default function ChatLayout({
  chats,
  chatId,
  pdfUrl,
  initialMessages,
}: ChatLayoutProps) {
  return (
    <Group
      orientation="horizontal"
      className="overflow-hidden"
      style={{
        height: "100vh",
        width: "100vw",
      }}
    >
      <Panel
        defaultSize="15%"
        minSize="10%"
        maxSize="30%"
        collapsible
        collapsedSize="4%"
      >
        <div className="h-full min-w-0 overflow-hidden">
          <ChatSideBar
            chats={chats}
            chatId={chatId}
          />
        </div>
      </Panel>

      <ResizeHandle />

      <Panel defaultSize="85%" minSize="40%">
        <Group
          orientation="horizontal"
          className="overflow-hidden"
          style={{
            height: "100%",
            width: "100%",
          }}
        >
          <Panel
            defaultSize="70%"
            minSize="30%"
          >
            <section className="h-full min-w-0 overflow-hidden p-4">
              <PDFViewer pdf_url={pdfUrl} />
            </section>
          </Panel>

          <ResizeHandle />

          <Panel
            defaultSize="30%"
            minSize="20%"
            maxSize="60%"
          >
            <section className="h-full min-w-0 overflow-hidden">
              <ChatComponent
                chatId={chatId}
                initialMessages={initialMessages}
              />
            </section>
          </Panel>
        </Group>
      </Panel>
    </Group>
  );
}

function ResizeHandle() {
  return (
    <Separator className="group relative w-2 shrink-0 cursor-col-resize bg-slate-200 transition-colors hover:bg-blue-400 focus:bg-blue-500">
      <div className="absolute left-1/2 top-1/2 h-12 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-400 group-hover:bg-white" />
    </Separator>
  );
}