import CalendarView from "components/CalendarView";
import { getServerSession } from "next-auth/next";
import { authOptions } from "lib/auth";
import { prisma } from "lib/prisma";
import GoogleLinkButton from "@/src/components/googleLinkButton";

export default async function CalendarPage() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Not authenticated");

  const events = await prisma.event.findMany({
    where: { userId: session.user.id },
    orderBy: { start: "asc" },
  });

  const tasks = await prisma.task.findMany({
    where: { userId: session.user.id, scheduledDate: { not: null } },
    orderBy: { scheduledDate: "asc" },
  });

  const unscheduledTasks = await prisma.task.findMany({
    where: { userId: session.user.id, scheduledDate: null, completed: false },
    orderBy: { createdAt: "desc" },
  });

  const allTasks = await prisma.task.findMany({
    where: { userId: session.user.id, completed: false },
    orderBy: { dueDate: "asc" },
  });

  return (
    <main className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Schedule</h1>
        <GoogleLinkButton isConnected={session.user.googleConnected} />
      </div>
      <div className="flex gap-6">
        {/* Calendar — takes up most of the space */}
        <div className="flex-1 min-w-0">
          <CalendarView
            events={events}
            tasks={tasks}
            allTasks={allTasks}
            userId={session.user.id}
            googleConnected={session.user.googleConnected}
          />
        </div>

        {/* Right sidebar */}
        <div className="w-64 flex-shrink-0 flex flex-col gap-4">
          {/* Unscheduled tasks */}
          <div className="bg-white rounded-2xl border p-4 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-3">Unscheduled Tasks</h2>
            {unscheduledTasks.length === 0 ? (
              <p className="text-xs text-gray-400">All tasks are scheduled 🎉</p>
            ) : (
              <div className="flex flex-col gap-2">
                {unscheduledTasks.map((t) => (
                  <div key={t.id} className="p-3 bg-gray-50 rounded-xl border">
                    <p className="text-sm font-semibold text-gray-800">{t.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        t.priority === "High" ? "bg-red-100 text-red-600" :
                        t.priority === "Medium" ? "bg-orange-100 text-orange-600" :
                        "bg-green-100 text-green-600"
                      }`}>{t.priority}</span>
                      {t.dueDate && (
                        <span className="text-xs text-gray-400">
                          Due {new Date(t.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}