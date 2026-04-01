"use client";

/**
 * CalendarView — top-level calendar component.
 * Composes the calendar grid, sidebars, modals, and schedule drawer.
 * All data fetching and interactions are delegated to custom hooks.
 */

import { useState, useEffect } from "react";
import { dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, addDays } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";

import CheckInModal from "./CheckInModal";
import RescheduleModal from "./RescheduleModal";
import EventDetailModal from "./EventDetailModal";
import QuickScheduleModal from "./QuickScheduleModal";
import CategoryManagerModal from "./CategoryManagerModal";
import ScheduleDrawer from "./ScheduleDrawer";
import UnscheduledPanel from "./UnscheduledPanel";
import FilterSidebar from "./FilterSidebar";
import CalendarBody from "./CalendarBody";

import { useCalendarData } from "@/hooks/useCalendarData";
import { useSchedule } from "@/hooks/useSchedule";
import { useCalendarInteractions } from "@/hooks/useCalendarInteractions";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: { "en-US": enUS },
});

export default function CalendarView({
  userId,
  googleConnected,
}: {
  events?: any[];
  tasks?: any[];
  allTasks?: any[];
  unscheduledTasks?: any[];
  userId: string;
  googleConnected?: boolean;
}) {
  const data = useCalendarData(userId);
  const sched = useSchedule(
    data.allFetchedTasks,
    data.refreshTasks,
    data.fetchScheduleLogs,
  );
  const ix = useCalendarInteractions(
    data.events,
    data.refreshEvents,
    data.refreshTasks,
  );

  const [calendarDate, setCalendarDate] = useState(new Date());
  const [activeFilters, setActiveFilters] = useState<Record<string, boolean>>({
    events: true,
    nonAcademic: true,
    tasks: true,
    priorityTasks: true,
    completed: false,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [quickScheduleTask, setQuickScheduleTask] = useState<any | null>(null);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [rescheduleQueue, setRescheduleQueue] = useState<any[]>([]);
  const [showReschedule, setShowReschedule] = useState(false);

  useEffect(() => {
    data.fetchCategories();
    data.fetchExams();
  }, []);

  useEffect(() => {
    const init = async () => {
      const evts = await data.refreshEvents();
      await data.refreshTasks(evts);
      await data.fetchScheduleLogs();
      setTimeout(() => setShowCheckIn(true), 900);
    };
    init();
  }, []);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") data.refreshTasks();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  /**
   * Builds the list of calendar items to display based on active filters.
   * Events are filtered by category; tasks by completion status and priority.
   */
  const getFilteredItems = () => {
    const items: any[] = [];
    data.events.forEach((e) => {
      const cat = data.categories.find((c) => c.name === e.category);
      if (cat && data.categoryFilters[cat.id]) items.push(e);
      else if (!cat && activeFilters.events) items.push(e);
    });
    if (activeFilters.tasks)
      items.push(
        ...data.tasks.filter((t) => !t.completed && t.priority !== "High"),
      );
    if (activeFilters.priorityTasks)
      items.push(
        ...data.tasks.filter((t) => !t.completed && t.priority === "High"),
      );
    if (activeFilters.completed)
      items.push(...data.tasks.filter((t) => t.completed));
    return items;
  };

  /**
   * Called when the check-in modal completes.
   * Refreshes tasks directly if nothing needs rescheduling,
   * otherwise queues the tasks and shows the reschedule modal.
   */
  const handleCheckInDone = async (toReschedule: any[]) => {
    setShowCheckIn(false);
    if (toReschedule.length === 0) {
      await data.refreshTasks();
      return;
    }
    setRescheduleQueue(toReschedule);
    setShowReschedule(true);
  };

  /**
   * Called when the reschedule modal confirms a set of task IDs.
   * Patches task durations to their remaining values, then posts a
   * week-mode schedule request for today through the coming Sunday.
   */
  const handleRescheduleConfirm = async (ids: string[]) => {
    setShowReschedule(false);
    if (ids.length === 0) {
      await data.refreshTasks();
      return;
    }
    await Promise.all(
      rescheduleQueue
        .filter((t) => ids.includes(t.id) && t.remainingDuration !== t.duration)
        .map((t) =>
          fetch(`/api/tasks/${t.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ duration: t.remainingDuration }),
          }),
        ),
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sunday = new Date(today);
    sunday.setDate(today.getDate() + ((7 - today.getDay()) % 7));
    const days: string[] = [];
    for (let d = new Date(today); d <= sunday; d.setDate(d.getDate() + 1))
      days.push(format(new Date(d), "yyyy-MM-dd"));
    await fetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskIds: ids,
        days,
        mode: "week",
        ignoreCapacity: false,
        dateLabel: `Rescheduled w/c ${format(today, "MMM d")}`,
        breakOverrides: sched.state.skipBreaks
          ? { sessionLength: 9999, breakLength: 0 }
          : {
              sessionLength: sched.state.breakSessionMins,
              breakLength: sched.state.breakLengthMins,
            },
      }),
    });
    setRescheduleQueue([]);
    await data.refreshTasks();
    await data.fetchScheduleLogs();
  };

  /** Returns the start (today at midnight) and end (coming Sunday) of the current week. */
  const weekBounds = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sunday = new Date(today);
    sunday.setDate(today.getDate() + ((7 - today.getDay()) % 7));
    return { weekStart: today, weekEnd: sunday };
  };

  /** Opens the event detail modal with the given event selected and editing disabled. */
  const openModal = (event: any) => {
    setSelectedEvent(event);
    setIsEditing(false);
    setIsModalOpen(true);
  };
  
  /** Closes the event detail modal and resets editing and task edit state. */
  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    ix.setIsTaskEditOpen(false);
  };

  return (
    <div className="flex gap-6">
      {showCheckIn && <CheckInModal onDone={handleCheckInDone} />}
      {showReschedule &&
        rescheduleQueue.length > 0 &&
        (() => {
          const { weekStart, weekEnd } = weekBounds();
          return (
            <RescheduleModal
              tasks={rescheduleQueue}
              weekStart={weekStart}
              weekEnd={weekEnd}
              onConfirm={handleRescheduleConfirm}
              onDismiss={async () => {
                setShowReschedule(false);
                setRescheduleQueue([]);
                await data.refreshTasks();
              }}
            />
          );
        })()}

      {/* Hidden on small screens, visible from lg breakpoint */}
      <div className="hidden lg:block">
        <FilterSidebar
          activeFilters={activeFilters}
          categories={data.categories}
          categoryFilters={data.categoryFilters}
          onToggleFilter={(key) =>
            setActiveFilters((p) => ({ ...p, [key]: !p[key] }))
          }
          onToggleCategory={(id) =>
            data.setCategoryFilters((p) => ({ ...p, [id]: !p[id] }))
          }
          onManageCategories={() => setShowCategoryManager(true)}
        />
      </div>

      <div className="flex-1 min-w-0">
        {/* Schedule buttons hidden on small screens */}
        <div className="hidden lg:flex gap-2 mb-4">
          <Button
            onClick={() => sched.open("day", calendarDate)}
            className="flex-1 bg-gray-900 text-white py-2 px-4 rounded-xl font-bold text-sm hover:bg-black transition-all"
          >
            Schedule My Day
          </Button>
          <Button
            onClick={() => sched.open("week", calendarDate)}
            className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all"
          >
            Schedule My Week
          </Button>
        </div>
        <CalendarBody
          localizer={localizer}
          filteredItems={getFilteredItems()}
          calendarDate={calendarDate}
          scheduleLogs={data.scheduleLogs}
          categories={data.categories}
          searchQuery={ix.searchQuery}
          searchResults={ix.searchResults}
          showSearchResults={ix.showSearchResults}
          showUndo={ix.showUndo}
          onNavigate={setCalendarDate}
          onSelectSlot={(date) => {
            setSelectedEvent(null);
            setSelectedDate(date);
            setIsModalOpen(true);
          }}
          onSelectEvent={openModal}
          onSearchChange={ix.handleSearch}
          onSearchFocus={ix.showSearchResultsFor}
          onSearchClear={ix.clearSearch}
          onSearchResultClick={(e) => {
            setCalendarDate(new Date(e.start));
            openModal(e);
          }}
          onUndo={ix.handleUndo}
          onUndoDismiss={ix.dismissUndo}
        />
      </div>

      {/* Hidden on small screens, visible from lg breakpoint */}
      <div className="hidden lg:block">
        <UnscheduledPanel
          unscheduledTasks={data.unscheduledTasks}
          scheduleLogs={data.scheduleLogs}
          events={data.events}
          categories={data.categories}
          onTaskClick={setQuickScheduleTask}
          onEditLog={(log) => {
            sched.patch({
              scheduleMode: log.mode,
              showScheduleDialog: true,
              ...(log.mode === "day"
                ? {
                    scheduleDate: format(new Date(log.scheduledAt), "yyyy-MM-dd"),
                  }
                : {
                    scheduleWeekStart: format(
                      new Date(log.scheduledAt),
                      "yyyy-MM-dd",
                    ),
                  }),
            });
          }}
          onDeleteLog={async (id) => {
            await fetch(`/api/schedule-log?id=${id}`, { method: "DELETE" });
            await data.refreshTasks();
            data.fetchScheduleLogs();
          }}
        />
      </div>

      {isModalOpen && (
        <EventDetailModal
          selectedEvent={selectedEvent}
          isEditing={isEditing}
          isTaskEditOpen={ix.isTaskEditOpen}
          taskFormData={ix.taskFormData}
          selectedDate={selectedDate}
          userId={userId}
          events={data.events}
          exams={data.exams}
          onClose={closeModal}
          onSetEditing={setIsEditing}
          onSetTaskEdit={ix.setIsTaskEditOpen}
          onFormChange={(c) => ix.setTaskFormData((p) => ({ ...p, ...c }))}
          onTaskSubmit={(merged) =>
            ix.submitTaskEdit(selectedEvent.id, merged ?? ix.taskFormData)
          }
          onDeleteTask={async () => {
            if (await ix.deleteTask(selectedEvent.id)) closeModal();
          }}
          onDeleteEvent={async (mode) => {
            if (await ix.deleteEvent(selectedEvent, mode)) closeModal();
          }}
          onEventSuccess={() => {
            closeModal();
            data.refreshEvents().then(() => data.refreshTasks());
          }}
        />
      )}

      {quickScheduleTask && (
        <QuickScheduleModal
          task={quickScheduleTask}
          onClose={() => setQuickScheduleTask(null)}
          onSaved={async () => {
            setQuickScheduleTask(null);
            await data.refreshTasks();
          }}
        />
      )}

      {showCategoryManager && (
        <CategoryManagerModal
          categories={data.categories}
          onClose={() => setShowCategoryManager(false)}
          onCategoriesChange={data.fetchCategories}
        />
      )}

      <ScheduleDrawer
        state={sched.state}
        patch={sched.patch}
        onSchedule={() => sched.schedule(false)}
        onScheduleForced={() => sched.schedule(true)}
        onClose={sched.close}
      />
    </div>
  );
}