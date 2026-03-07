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
    where: {
      userId: session.user.id,
      scheduledDate: { not: null },
    },
    orderBy: { scheduledDate: "asc" },
  });

  return (
    <main className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Schedule</h1>
        <GoogleLinkButton isConnected={session.user.googleConnected} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3">
          <CalendarView
            events={events}
            tasks={tasks}
            userId={session.user.id}
            googleConnected={session.user.googleConnected}
          />
        </div>
        <div className="bg-gray-50 p-4 rounded-lg border h-fit">
          <h2 className="font-semibold mb-2">Sync Settings</h2>
          <p className="text-sm text-gray-600">
            {session.user.googleConnected
              ? "Your events are ready to sync with Google."
              : "Connect your Google account to sync these events to your mobile device."}
          </p>
        </div>
      </div>
    </main>
  );
}
