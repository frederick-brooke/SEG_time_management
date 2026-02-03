import CalendarView from "components/CalendarView";
import { getServerSession } from "next-auth/next";
import { authOptions } from "lib/auth";
import { prisma } from "lib/prisma";

export default async function CalendarPage() {
  // Get logged-in user
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Not authenticated");

  // Fetch only events for this user
  const events = await prisma.event.findMany({
    where: { userId: session.user.id },
    orderBy: { start: "asc" },
  });

  return (
    <main className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">My Schedule</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <CalendarView events={events} userId={session.user.id} />
        </div>
      </div>
    </main>
  );
}
