/**
 * Group detail server page.
 * Authenticates the user, fetches group data (details, events, and tasks),
 * and renders the client-side GroupDetail view.
 * Returns a fallback UI if the group does not exist or access is denied.
 */

import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { redirect } from "next/navigation";
import { getGroupDetails, getGroupEvents, getGroupTasksWithProgress } from "@/app/actions/groups";
import GroupDetailClient from "./GroupDetailClient";

/**
 * Server component that fetches group details, events, and task progress data
 * @param {Promise<{ groupId: string }>} params - Route params containing group ID
 * @return {JSX.Element} - Group detail page
 */
export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const group = await getGroupDetails(groupId);

  if (!group) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-red-600">Group not found</h1>
          <p className="mt-2 text-gray-600">
            This group does not exist or you are not a member.
          </p>
        </div>
      </div>
    );
  }

  // Fetch events and task progress in parallel
  const [events, tasksWithProgress] = await Promise.all([
    getGroupEvents(groupId),
    getGroupTasksWithProgress(groupId),
  ]);

  return (
    <GroupDetailClient
      group={group}
      events={events}
      tasksWithProgress={tasksWithProgress}
    />
  );
}