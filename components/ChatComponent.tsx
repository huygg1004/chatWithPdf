"use client";

import React from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Send } from "lucide-react";

import { Input } from "./ui/input";
import { Button } from "./ui/button";
import MessageList from "./MessageList";

type Props = {
  chatId: number;
  initialMessages: UIMessage[];
};

const ChatComponent = ({
  chatId,
  initialMessages,
}: Props) => {
  const [input, setInput] = React.useState("");

  const { messages, sendMessage, status } = useChat({
    messages: initialMessages,

    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: {
        chatId,
      },
    }),
  });

  const isLoading =
    status === "submitted" ||
    status === "streaming";

  React.useEffect(() => {
    const messageContainer =
      document.getElementById("message-container");

    if (messageContainer) {
      messageContainer.scrollTo({
        top: messageContainer.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const trimmedInput = input.trim();

    if (!trimmedInput || isLoading) {
      return;
    }

    sendMessage({
      text: trimmedInput,
    });

    setInput("");
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b bg-white p-2">
        <h3 className="text-xl font-bold">Chat</h3>
      </div>

      <div
        id="message-container"
        className="min-h-0 flex-1 overflow-y-auto"
      >
        <MessageList
          messages={messages}
          isLoading={isLoading}
        />
      </div>

      <form
        onSubmit={handleSubmit}
        className="shrink-0 border-t bg-white px-2 py-4"
      >
        <div className="flex">
          <Input
            value={input}
            onChange={(event) =>
              setInput(event.target.value)
            }
            placeholder="Ask any question..."
            className="w-full"
            disabled={isLoading}
          />

          <Button
            type="submit"
            className="ml-2 bg-blue-600"
            disabled={isLoading || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatComponent;