import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { loadS3IntoPinecone } from "@/lib/pinecone";
import { getS3Url } from "@/lib/s3";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// /api/create-chat
export async function POST(req: Request) {
  try {
    // 1. Authenticate user
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await req.json();
    const { file_key, file_name } = body;

    if (!file_key || !file_name) {
      return NextResponse.json(
        { error: "file_key and file_name are required" },
        { status: 400 }
      );
    }

    console.log("Creating chat:", {
      file_key,
      file_name,
      userId,
    });

    // 3. Load PDF from S3 and upload embeddings to Pinecone
    console.log("Loading PDF into Pinecone...");

    await loadS3IntoPinecone(file_key);

    console.log("PDF successfully loaded into Pinecone");

    // 4. Create chat record in database
    console.log("Creating chat database record...");

    const chat = await db
      .insert(chats)
      .values({
        fileKey: file_key,
        pdfName: file_name,
        pdfUrl: getS3Url(file_key),
        userId,
      })
      .returning({
        insertedId: chats.id,
      });

    console.log("Chat created:", chat[0].insertedId);

    // 5. Return chat ID
    return NextResponse.json(
      {
        chat_id: chat[0].insertedId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("CREATE CHAT ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Internal server error",
      },
      { status: 500 }
    );
  }
}