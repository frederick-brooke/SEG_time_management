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
      <CalendarView
        events={events}
        tasks={tasks}
        allTasks={allTasks}
        unscheduledTasks={unscheduledTasks}
        userId={session.user.id}
        googleConnected={session.user.googleConnected}
      />
    </main>
  );
}