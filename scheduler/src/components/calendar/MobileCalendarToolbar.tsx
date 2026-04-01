"use client";

/**
 * MobileCalendarToolbar
 * Shown only on small screens (lg:hidden).
 * Surfaces Schedule Day/Week, Unscheduled Tasks, and Filters
 * as a sticky bottom bar with sheet-style drawers.
 */

import { useState } from "react";
import FilterSidebar from "./FilterSidebar";
import UnscheduledPanel from "./UnscheduledPanel";

interface Props {
  // Schedule
  onScheduleDay: () => void;
  onScheduleWeek: () => void;

  // Filter sidebar props
  activeFilters: Record<string, boolean>;
  categories: any[];
  categoryFilters: Record<string, boolean>;
  onToggleFilter: (key: string) => void;
  onToggleCategory: (id: string) => void;
  onManageCategories: () => void;

  // Unscheduled panel props
  unscheduledTasks: any[];
  scheduleLogs: any[];
  events: any[];
  onTaskClick: (task: any) => void;
  onEditLog: (log: any) => void;
  onDeleteLog: (id: string) => Promise<void>;
}

type Sheet = "filters" | "unscheduled" | null;

export default function MobileCalendarToolbar({
  onScheduleDay,
  onScheduleWeek,
  activeFilters,
  categories,
  categoryFilters,
  onToggleFilter,
  onToggleCategory,
  onManageCategories,
  unscheduledTasks,
  scheduleLogs,
  events,
  onTaskClick,
  onEditLog,
  onDeleteLog,
}: Props) {
  const [openSheet, setOpenSheet] = useState<Sheet>(null);

  const close = () => setOpenSheet(null);

  return (
    <>
      {/* Bottom toolbar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#111118] border-t border-white/[0.07] px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex items-center gap-2">
        {/* Schedule Day */}
        <button
          onClick={onScheduleDay}
          className="flex-1 bg-gray-900 text-white py-2.5 px-3 rounded-xl font-bold text-xs hover:bg-black transition-all border border-white/10"
        >
          📅 Day
        </button>

        {/* Schedule Week */}
        <button
          onClick={onScheduleWeek}
          className="flex-1 bg-indigo-600 text-white py-2.5 px-3 rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all"
        >
          🗓 Week
        </button>

        {/* Unscheduled tasks */}
        <button
          onClick={() => setOpenSheet(openSheet === "unscheduled" ? null : "unscheduled")}
          className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition-all border ${
            openSheet === "unscheduled"
              ? "bg-purple-600 text-white border-purple-500"
              : "bg-white/5 text-white/60 border-white/10 hover:border-white/25"
          }`}
        >
          Tasks
          {unscheduledTasks.length > 0 && (
            <span className="ml-1 bg-purple-500 text-white text-[10px] font-black rounded-full px-1.5 py-0.5">
              {unscheduledTasks.length}
            </span>
          )}
        </button>

        {/* Filters */}
        <button
          onClick={() => setOpenSheet(openSheet === "filters" ? null : "filters")}
          className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition-all border ${
            openSheet === "filters"
              ? "bg-indigo-600 text-white border-indigo-500"
              : "bg-white/5 text-white/60 border-white/10 hover:border-white/25"
          }`}
        >
          🎛 Filters
        </button>
      </div>

      {/* Sheet backdrop */}
      {openSheet && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          onClick={close}
        />
      )}

      {/* Filters sheet */}
      <div
        className={`lg:hidden fixed bottom-[80px] left-0 right-0 z-40 bg-[#111118] border-t border-white/[0.07] rounded-t-2xl transition-transform duration-300 ease-in-out max-h-[70vh] overflow-y-auto ${
          openSheet === "filters" ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <p className="text-sm font-bold text-white">Filters</p>
          <button onClick={close} className="text-white/40 hover:text-white/70 text-lg">✕</button>
        </div>
        <div className="px-4 pb-6">
          <FilterSidebar
            activeFilters={activeFilters}
            categories={categories}
            categoryFilters={categoryFilters}
            onToggleFilter={onToggleFilter}
            onToggleCategory={onToggleCategory}
            onManageCategories={() => {
              close();
              onManageCategories();
            }}
          />
        </div>
      </div>

      {/* Unscheduled tasks sheet */}
      <div
        className={`lg:hidden fixed bottom-[80px] left-0 right-0 z-40 bg-[#111118] border-t border-white/[0.07] rounded-t-2xl transition-transform duration-300 ease-in-out max-h-[70vh] overflow-y-auto ${
          openSheet === "unscheduled" ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <p className="text-sm font-bold text-white">Unscheduled Tasks</p>
          <button onClick={close} className="text-white/40 hover:text-white/70 text-lg">✕</button>
        </div>
        <div className="px-4 pb-6">
          <UnscheduledPanel
            unscheduledTasks={unscheduledTasks}
            scheduleLogs={scheduleLogs}
            events={events}
            categories={categories}
            onTaskClick={(task) => {
              close();
              onTaskClick(task);
            }}
            onEditLog={(log) => {
              close();
              onEditLog(log);
            }}
            onDeleteLog={onDeleteLog}
          />
        </div>
      </div>

      <div className="lg:hidden h-[80px]" />
    </>
  );
}
