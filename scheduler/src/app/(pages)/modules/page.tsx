import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { redirect } from "next/navigation";
import ModulesPageClient from "./ModulesPageClient";
import { getMyModules } from "@/app/actions/module";

/**
 * Server component that authenticates the user, fetches their active modules, 
 * and passes the data to the client-side list component.
 *
 * @return {Promise<JSX.Element>} The rendered Modules list page.
 */
export default async function ModulesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const modules = await getMyModules();

  return <ModulesPageClient modules={modules} />;
}