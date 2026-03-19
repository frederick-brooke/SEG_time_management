"use server";

import prisma from "lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";

export async function createEvent(formData: FormData) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const title = formData.get("title") as string;
  const start = new Date(formData.get("start") as string);
  const end = new Date(formData.get("end") as string);

  await prisma.event.create({
    data: {
      title,
      start,
      end,
      category: "General", 
      userId: session.user.id, 
    },
  });
}