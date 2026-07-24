import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";

type RouteContext = {
  params: Promise<{
    chatId: string;
  }>;
};

export async function DELETE(
  _request: Request,
  { params }: RouteContext,
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { chatId } = await params;
  const parsedChatId = Number(chatId);

  if (!Number.isInteger(parsedChatId)) {
    return NextResponse.json(
      { error: "Invalid chat ID" },
      { status: 400 },
    );
  }

  const deletedChats = await db
    .delete(chats)
    .where(
      and(
        eq(chats.id, parsedChatId),
        eq(chats.userId, userId),
      ),
    )
    .returning({
      id: chats.id,
    });

  if (deletedChats.length === 0) {
    return NextResponse.json(
      { error: "Chat not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    success: true,
  });
}