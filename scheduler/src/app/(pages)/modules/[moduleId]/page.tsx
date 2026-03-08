import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { getModuleDetails, getModuleEvents, getModuleTasks } from "@/src/app/actions/module";
import ModuleDetailClient from "./ModuleDetailClient";

/**
 * Server component that fetches module details
 * @param {Object} params - Route params containing module ID
 * @return {JSX.Element} - Module detail page
 */
export default async function ModuleDetailPage({ 
  params 
}: { 
  params: Promise<{ moduleId: string }> 
}) {
  const { moduleId } = await params;
  
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect("/login");
  }

  const module = await getModuleDetails(moduleId);

  if (!module) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-red-600">Module not found</h1>
          <p className="mt-2 text-gray-600">
            This module doesn't exist or you don't have access to it.
          </p>
        </div>
      </div>
    );
  }

  // Fetch module events and tasks
  const events = await getModuleEvents(moduleId);
  const tasks = await getModuleTasks(moduleId);

  return <ModuleDetailClient module={module} events={events} tasks={tasks} />;
}