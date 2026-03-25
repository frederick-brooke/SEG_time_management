import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Applies a temporary ban to a user.
 *
 * - Sets `isBanned` to true
 * - Calculates and assigns a ban expiration date
 *
 * @param {string} userId - ID of the user to ban
 * @param {number} durationDays - Duration of the ban in days
 * @returns {Promise<Object>} Updated user record
 */
async function applyTempBan(userId: string, durationDays: number) {
  const expires = new Date();
  expires.setDate(expires.getDate() + durationDays);

  return prisma.user.update({
    where: { id: userId },
    data: { isBanned: true, banExpires: expires },
  });
}

/**
 * Applies a permanent ban to a user.
 *
 * - Sets `isBanned` to true
 * - Clears any expiration date
 *
 * @param {string} userId - ID of the user to ban
 * @returns {Promise<Object>} Updated user record
 */
async function applyPermanentBan(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { isBanned: true, banExpires: null },
  });
}

/**
 * Removes any active ban from a user.
 *
 * - Sets `isBanned` to false
 * - Clears expiration date
 *
 * @param {string} userId - ID of the user
 * @returns {Promise<Object>} Updated user record
 */
async function removeBan(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { isBanned: false, banExpires: null },
  });
}

/**
 * Marks a report as resolved and assigns the handling admin.
 *
 * @param {string} reportId - ID of the report
 * @param {string} handlerId - ID of the admin resolving the report
 * @returns {Promise<Object>} Updated report record
 */
async function resolveReport(reportId: string, handlerId: string) {
  return prisma.report.update({
    where: { id: reportId },
    data: {
      status: "RESOLVED",
      handledById: handlerId,
    },
  });
}

/**
 * Handles moderation actions on users.
 *
 * Supported actions:
 * - TEMP: Apply temporary ban (requires durationDays)
 * - PERMANENT: Apply permanent ban
 * - UNBAN: Remove ban
 *
 * Additional behavior:
 * - Optionally resolves an associated report
 *
 * Access Control:
 * - Restricted to SUPERUSER role
 *
 * @param {Request} req - Incoming request
 * @param {{ params: Promise<{ id: string }> }} context - Route parameters
 * @returns {Promise<NextResponse>} JSON response indicating success or failure
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);	// Retrieve authenticated session

    if (!session || session.user.role !== "SUPERUSER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });		// Enforce SUPERUSER access
    }

    const { id } = await params;
    const { type, durationDays, reportId } = await req.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "User ID missing" },
        { status: 400 }		// Validate required user ID
      );
    }

    if (type === "TEMP") {		// Handle moderation actions
      if (!durationDays) {
        return NextResponse.json(
          { success: false, error: "durationDays required for TEMP ban" },
          { status: 400 }
        );
      }
      await applyTempBan(id, durationDays);
    }

    if (type === "PERMANENT") { await applyPermanentBan(id);}

    if (type === "UNBAN") {await removeBan(id);}

    if (reportId) { await resolveReport(reportId, session.user.id);}	// Optionally resolve associated report

    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (process.env.NODE_ENV !== "test") {		// Avoid noisy logs in test environment
      console.error(e);
    }

    return NextResponse.json(
      { success: false, error: e.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}