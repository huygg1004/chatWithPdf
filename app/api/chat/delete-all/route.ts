import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";

export async function DELETE() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const deletedChats = await db
      .delete(chats)
      .where(eq(chats.userId, userId))
      .returning({
        id: chats.id,
      });

    return NextResponse.json({
      success: true,
      deletedCount: deletedChats.length,
    });
  } catch (error) {
    console.error("Failed to delete all chats:", error);

    return NextResponse.json(
      { error: "Failed to delete all chats" },
      { status: 500 },
    );
  }
}