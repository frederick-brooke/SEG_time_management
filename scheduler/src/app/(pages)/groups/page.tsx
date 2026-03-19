import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { redirect } from "next/navigation";
import GroupsPageClient from "./GroupsPageClient";
import { getMyGroups } from "@/app/actions/groups";

/**
 * Server component that fetches the current user's groups
 * @return {JSX.Element} - Groups list page
 */
export default async function GroupsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const groups = await getMyGroups();

  return <GroupsPageClient groups={groups} />;
}
