import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import CalendarView from "@/components/calendar/CalendarView";
import GoogleLinkButton from "@/components/shared/GoogleLinkButton";
import LunarThemeWrapper from "@/components/layout/LunarThemeWrapper";
import { checkUpcomingEventNotifications } from "@/app/actions/calendar/calendarNotifications";

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
  await checkUpcomingEventNotifications(session.user.id);

  return (
    <LunarThemeWrapper>
      <main className="max-w-7xl mx-auto pt-8 pb-12 px-4 lg:px-16 space-y-6 text-white/90">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
          <div className="flex-1 space-y-1">
            <h1 className="lunar-header text-4xl">My Schedule</h1>
            <p className="lunar-label-subtitle">Plan and manage your events and tasks</p>
          </div>
          <div className="shrink-0 flex items-center">
            <GoogleLinkButton isConnected={session.user.googleConnected ?? false} />
          </div>
        </div>

        <hr className="border-white/5" />

        {/*
         * CalendarView receives empty arrays as initial props.
         * All data is fetched client-side on mount.
         */}
        <CalendarView
          events={[]}
          tasks={[]}
          allTasks={[]}
          unscheduledTasks={[]}
          userId={session.user.id}
          googleConnected={session.user.googleConnected ?? false}
        />

      </main>
    </LunarThemeWrapper>
  );
}