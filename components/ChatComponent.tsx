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
    <div
      className="relative max-h-screen overflow-scroll"
      id="message-container"
    >
      <div className="sticky inset-x-0 top-0 h-fit bg-white p-2">
        <h3 className="text-xl font-bold">Chat</h3>
      </div>

      <MessageList
        messages={messages}
        isLoading={isLoading}
      />

      <form
        onSubmit={handleSubmit}
        className="sticky inset-x-0 bottom-0 bg-white px-2 py-4"
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