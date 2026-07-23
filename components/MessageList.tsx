import { cn } from "@/lib/utils";
import type { UIMessage } from "ai";
import { Loader2 } from "lucide-react";
import React from "react";

type Props = {
  isLoading: boolean;
  messages: UIMessage[];
};

const MessageList = ({ messages, isLoading }: Props) => {
  return (
    <div className="flex flex-col gap-2 px-4 py-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn("flex", {
            "justify-end pl-10": message.role === "user",
            "justify-start pr-10": message.role === "assistant",
          })}
        >
          <div
            className={cn(
              "rounded-lg px-3 py-2 text-sm shadow-md ring-1 ring-gray-900/10",
              {
                "bg-blue-600 text-white": message.role === "user",
                "bg-white text-gray-900":
                  message.role === "assistant",
              }
            )}
          >
            {message.parts.map((part, index) => {
              if (part.type !== "text") {
                return null;
              }

              return (
                <span
                  key={index}
                  className="whitespace-pre-wrap"
                >
                  {part.text}
                </span>
              );
            })}
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex justify-start pr-10">
          <div className="rounded-lg bg-white px-3 py-2 shadow-md ring-1 ring-gray-900/10">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageList;