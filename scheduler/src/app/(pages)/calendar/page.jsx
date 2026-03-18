import CalendarView from "components/CalendarView";
import { getServerSession } from "next-auth/next";
import { authOptions } from "lib/auth";
import GoogleLinkButton from "@/src/components/googleLinkButton";

// ---------------------------------------------------------------------------
// We intentionally do NOT pre-fetch events/tasks here.
// CalendarView fetches everything on mount via refreshEvents() + refreshTasks()
// which ensures:
//   a) recurring events are expanded correctly via the API route
//   b) unscheduledTasks uses shouldShowAsUnscheduled() not a simple DB filter
//   c) no stale initial state on first paint
// ---------------------------------------------------------------------------
export default async function CalendarPage() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Not authenticated");

  return (
    <main className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Schedule</h1>
        <GoogleLinkButton isConnected={session.user.googleConnected} />
      </div>
      <CalendarView
        events={[]}
        tasks={[]}
        allTasks={[]}
        unscheduledTasks={[]}
        userId={session.user.id}
        googleConnected={session.user.googleConnected}
      />
    </main>
  );
}
