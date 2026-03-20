import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import CalendarView from "@/src/components/calendar/CalendarView";
import GoogleLinkButton from "@/components/googleLinkButton";
import { StarBackground } from "@/components/ui/StarBackground";

/**
 * Server-side calendar page component.
 *
 * Events and tasks are intentionally not pre-fetched here.
 * CalendarView fetches everything on mount via refreshEvents() and refreshTasks() to ensure:
 * - Recurring events are expanded correctly via the API route
 * - unscheduledTasks uses shouldShowAsUnscheduled() rather than a simple DB filter
 * - No stale initial state on first paint
 *
 * Redirects to /login if the user is not authenticated.
 *
 * @async
 * @returns {JSX.Element} The rendered calendar page
 */
export default async function CalendarPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <main 
      className="chat-bg container mx-auto px-6 pt-4 pb-8 relative min-h-screen"
      style={{ background: "linear-gradient(160deg, #080c14 0%, #0a0f1e 50%, #06080f 100%)" }}
    >
      <StarBackground />

      <div className="flex justify-between items-center mb-3">
        <h1 className="text-2xl font-bold">My Schedule</h1>
        <GoogleLinkButton isConnected={session.user.googleConnected} />
      </div>
      <div className="relative z-10">
        {/*
         * CalendarView receives empty arrays as initial props.
         * All data is fetched client-side on mount — see JSDoc above for reasoning.
         */}
        <CalendarView
          events={[]}
          tasks={[]}
          allTasks={[]}
          unscheduledTasks={[]}
          userId={session.user.id}
          googleConnected={session.user.googleConnected}
        />
      </div>
    </main>
  );
}
