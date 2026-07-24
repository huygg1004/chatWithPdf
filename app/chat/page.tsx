import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";

export default async function ChatsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const userChats = await db
    .select()
    .from(chats)
    .where(eq(chats.userId, userId));

  if (userChats.length === 0) {
    redirect("/");
  }

  redirect(`/chat/${userChats[0].id}`);
}