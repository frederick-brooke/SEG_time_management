import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { redirect } from "next/navigation";
import {getModuleDetails, getModuleEvents, getModuleTasks, getModuleTasksWithProgress,} from "@/app/actions/module";
import ModuleDetailClient from "./ModuleDetailClient";
import { ModuleRole } from "@prisma/client";

/**
 * Server component that fetches module details and role-appropriate task data
 * Owners receive full progress data; members receive only their own tasks
 * @param {Promise<{ moduleId: string }>} params - Route params containing module ID
 * @return {JSX.Element} - Module detail page
 */
export default async function ModuleDetailPage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
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
            This module does not exist or you do not have access to it.
          </p>
        </div>
      </div>
    );
  }

  const isOwnerOrAdmin =
    module.userRole === ModuleRole.OWNER || module.userRole === ModuleRole.ADMIN;

  // Fetch role-appropriate task data and events in parallel
  const [events, tasks, tasksWithProgress] = await Promise.all([
    getModuleEvents(moduleId),
    isOwnerOrAdmin ? Promise.resolve([]) : getModuleTasks(moduleId),
    isOwnerOrAdmin ? getModuleTasksWithProgress(moduleId) : Promise.resolve([]),
  ]);

  return (
    <ModuleDetailClient
      module={module}
      events={events}
      tasks={tasks}
      tasksWithProgress={tasksWithProgress}
    />
  );
}
