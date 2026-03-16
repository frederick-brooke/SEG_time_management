import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import ModulesPageClient from "./ModulesPageClient";
import { getMyModules } from "@/src/app/actions/module";

/**
 * Server component that fetches user's modules
 * @return {JSX.Element} - Modules list page
 */
export default async function ModulesPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect("/login");
  }

  const modules = await getMyModules();

  return <ModulesPageClient modules={modules} />;
}