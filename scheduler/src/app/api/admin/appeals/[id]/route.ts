/**
 * API route for handling appeal moderation (approve/reject).
 *
 * Only accessible to SUPERUSER accounts. Approving an appeal unbans the user
 * and clears ban data, while rejecting simply updates the appeal status.
 */

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Handles approval of an appeal.
 *
 * - Unbans the user
 * - Clears any ban expiration
 * - Updates the appeal status to APPROVED
 * - Records the admin who handled the appeal
 *
 * @param {string} appealId - ID of the appeal
 * @param {string} userId - ID of the user who submitted the appeal
 * @param {string} handlerId - ID of the admin handling the appeal
 * @returns {Promise<void>}
 */
async function handleApprove(appealId: string, userId: string, handlerId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { isBanned: false, banExpires: null },
  });

  await prisma.appeal.update({
    where: { id: appealId },
    data: { status: "APPROVED", handledById: handlerId },
  });
}

/**
 * Handles rejection of an appeal.
 *
 * - Updates the appeal status to REJECTED
 *
 * @param {string} appealId - ID of the appeal
 * @returns {Promise<void>}
 */
async function handleReject(appealId: string) {
  await prisma.appeal.update({
    where: { id: appealId },
    data: { status: "REJECTED" },
  });
}

/**
 * Handles PATCH requests for updating appeal status.
 *
 * Supported actions:
 * - APPROVE: Unbans the user and approves the appeal
 * - REJECT: Marks the appeal as rejected
 *
 * Access Control:
 * - Only SUPERUSER role is authorized
 *
 * @param {Request} req - Incoming request
 * @param {{ params: Promise<{ id: string }> }} context - Route parameters
 * @returns {Promise<NextResponse>} JSON response indicating success or failure
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPERUSER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const { id } = await params;
  const { action } = await req.json();

  try {
    const appeal = await prisma.appeal.findUnique({ where: { id } });

    if (!appeal) {
      return NextResponse.json(
        { success: false, error: "Appeal not found" },
        { status: 404 }
      );
    }

    if (action === "APPROVE") { await handleApprove(id, appeal.userId, session.user.id); }

    if (action === "REJECT") { await handleReject(id); }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}