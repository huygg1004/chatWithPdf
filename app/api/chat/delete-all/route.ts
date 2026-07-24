import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { deleteFilesFromS3 } from "@/lib/s3-server";
import { deletePineconeNamespaces } from "@/lib/pinecone";

export async function DELETE() {
  try {
    // 1. Check that the user is logged in
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    // 2. Find all chats belonging to this user
    const userChats = await db
      .select({
        id: chats.id,
        fileKey: chats.fileKey,
      })
      .from(chats)
      .where(eq(chats.userId, userId));

    // 3. If the user has no chats, stop here
    if (userChats.length === 0) {
      return NextResponse.json({
        success: true,
        deletedCount: 0,
        message: "No chats to delete",
      });
    }

    // 4. Get the unique S3 file keys
    const fileKeys = [
      ...new Set(
        userChats.map((chat) => chat.fileKey),
      ),
    ];

    console.log(
      `Deleting ${fileKeys.length} PDF file(s) for user ${userId}`,
    );

    // 5. Delete all Pinecone vectors
    await deletePineconeNamespaces(fileKeys);

    // 6. Delete all PDF files from S3
    await deleteFilesFromS3(fileKeys);

    // 7. Delete all chat records from Neon
    // Messages are automatically deleted because of onDelete: "cascade"
    const deletedChats = await db
      .delete(chats)
      .where(eq(chats.userId, userId))
      .returning({
        id: chats.id,
      });

    console.log(
      `Successfully deleted ${deletedChats.length} chat(s)`,
    );

    // 8. Return success response
    return NextResponse.json({
      success: true,
      deletedCount: deletedChats.length,
      deletedFileCount: fileKeys.length,
    });
  } catch (error) {
    console.error(
      "Failed to delete all chats:",
      error,
    );

    return NextResponse.json(
      {
        error: "Failed to delete all chats",
      },
      {
        status: 500,
      },
    );
  }
}