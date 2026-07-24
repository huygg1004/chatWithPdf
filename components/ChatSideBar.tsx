"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MessageCircle,
  PlusCircle,
  Trash2,
} from "lucide-react";

import { DrizzleChat } from "@/lib/db/schema";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

type Props = {
  chats: DrizzleChat[];
  chatId: number;
};

const ChatSideBar = ({ chats, chatId }: Props) => {
  const router = useRouter();

  const [deletingChatId, setDeletingChatId] =
    useState<number | null>(null);

  const [isDeletingAll, setIsDeletingAll] =
    useState(false);

  const handleDelete = async (
    event: React.MouseEvent<HTMLButtonElement>,
    deletedChatId: number,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const chatToDelete = chats.find(
      (chat) => chat.id === deletedChatId,
    );

    const confirmed = window.confirm(
      `Delete "${chatToDelete?.pdfName ?? "this chat"}" and all of its messages?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingChatId(deletedChatId);

      const response = await fetch(
        `/api/chat/${deletedChatId}`,
        {
          method: "DELETE",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ?? "Failed to delete chat",
        );
      }

      const remainingChats = chats.filter(
        (chat) => chat.id !== deletedChatId,
      );

      if (deletedChatId === chatId) {
        const nextChat = remainingChats[0];

        if (nextChat) {
          router.push(`/chat/${nextChat.id}`);
        } else {
          router.push("/");
        }
      }

      router.refresh();
    } catch (error) {
      console.error("Delete chat error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete chat",
      );
    } finally {
      setDeletingChatId(null);
    }
  };

  const handleDeleteAll = async () => {
    if (chats.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      `Delete all ${chats.length} chats and all corresponding messages?\n\nThis action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsDeletingAll(true);

      const response = await fetch(
        "/api/chat/delete-all",
        {
          method: "DELETE",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ?? "Failed to delete all chats",
        );
      }

      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Delete all chats error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete all chats",
      );
    } finally {
      setIsDeletingAll(false);
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-gray-900 p-4 text-gray-200">
      <Link href="/">
        <Button className="w-full border border-dashed border-white">
          <PlusCircle className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </Link>

      <Button
        type="button"
        variant="destructive"
        className="mt-2 w-full"
        disabled={isDeletingAll || chats.length === 0}
        onClick={handleDeleteAll}
      >
        <Trash2 className="mr-2 h-4 w-4" />

        {isDeletingAll
          ? "Deleting..."
          : "Delete All Chats"}
      </Button>

      <div className="mt-4 flex flex-col gap-2">
        {chats.map((chat) => {
          const isDeleting =
            deletingChatId === chat.id;

          return (
            <Link
              key={chat.id}
              href={`/chat/${chat.id}`}
            >
              <div
                className={cn(
                  "group flex items-center rounded-lg p-3",
                  {
                    "bg-blue-600 text-white":
                      chat.id === chatId,
                    "text-slate-300 hover:bg-slate-800 hover:text-white":
                      chat.id !== chatId,
                  },
                )}
              >
                <MessageCircle className="mr-2 h-5 w-5 shrink-0" />

                <p className="min-w-0 flex-1 truncate text-sm">
                  {chat.pdfName}
                </p>

                <button
                  type="button"
                  disabled={isDeleting || isDeletingAll}
                  aria-label={`Delete ${chat.pdfName}`}
                  onClick={(event) =>
                    handleDelete(event, chat.id)
                  }
                  className="rounded p-1 opacity-0 transition hover:bg-red-500 hover:text-white group-hover:opacity-100 focus:opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default ChatSideBar;