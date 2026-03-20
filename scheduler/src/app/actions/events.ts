// app/actions/events.ts
"use server";
import prisma from "lib/prisma";

export async function createEvent(formData: FormData, userId: string) {
  const title = formData.get("title") as string;
  const start = new Date(formData.get("start") as string);
  const end = new Date(formData.get("end") as string);

  await prisma.event.create({
    data: { title, start, end, category: "Personal", userId },
  });
}
