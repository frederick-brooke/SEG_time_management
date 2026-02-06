'use server'

import { prisma } from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { revalidatePath } from "next/cache";

export async function createTask(formData: FormData) {
  const session = await getServerSession(authOptions);
  
  // 1. Security Check
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // 2. Extract Data from Form
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const priority = formData.get("priority") as string;
  // Subtasks are a bit complex, keeping it simple for now or parsing JSON
  
  // 3. Save to Database
  await prisma.task.create({
    data: {
      title: name,
      description: description,
      completed: false, // Default to To Do
      userId: session.user.id, // <--- THIS IS THE KEY LINK
      // Add priority if your schema has it, otherwise skip
    }
  });

  // 4. Refresh the page so the new task shows up
  revalidatePath("/dashboard"); 
}

export async function getTasks() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return [];

    return await prisma.task.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' }
    });
}