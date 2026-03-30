"use server"

/**
 * Event Creation Service
 * 
 * Handles creation of user events from form submissions.
 * Requires authentication and stores event data via Prisma.
 */

import { prisma } from "lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";

/**
 * Creates a new event for the authenticated user.
 *
 * @param {FormData} formData - Form data containing title, start, end, and optional category.
 * @throws {Error} If the user is not authenticated.
 */
export async function createEvent(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const title = formData.get("title") as string;
  const start = new Date(formData.get("start") as string);
  const end = new Date(formData.get("end") as string);
  const category = (formData.get("category") as string) || "default";

  await prisma.event.create({
    data: {
      title,
      start,
      end,
      category,
      userId: session.user.id,
    },
  });
}