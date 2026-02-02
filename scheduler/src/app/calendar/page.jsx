import prisma from "lib/prisma";
import CalendarView from "components/CalendarView";

export default async function CalendarPage() {
  const events = await prisma.event.findMany();

  return (
    <main className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">My Schedule</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <CalendarView events={events} />
        </div>
      </div>
    </main>
  );
}