"use client";
import { format } from "date-fns";

interface QuickScheduleModalProps {
  task: any;
  onClose: () => void;
  onSaved: () => void;
}

// Modal for quickly scheduling a task by selecting a date and time.
export default function QuickScheduleModal({
  task,
  onClose,
  onSaved,
}: QuickScheduleModalProps) {
  const handleSchedule = async () => {
    const dateVal = (
      document.getElementById("quick-schedule-date") as HTMLInputElement
    ).value;
    const timeVal = (
      document.getElementById("quick-schedule-time") as HTMLInputElement
    ).value;
    if (!dateVal || !timeVal) return;
    const [year, month, day] = dateVal.split("-").map(Number);
    const [hour, minute] = timeVal.split(":").map(Number);
    const scheduledDate = new Date(year, month - 1, day, 0, 0, 0, 0);
    const scheduledTime = new Date(year, month - 1, day, hour, minute, 0, 0);
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scheduledDate: scheduledDate.toISOString(),
        scheduledTime: scheduledTime.toISOString(),
      }),
    });
    onSaved();
  };

  return (
    <div
      className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 backdrop-blur-md z-[9999]"
      onClick={onClose}
    >
      <div
        className="bg-[#111118] border border-white/[0.07] p-8 rounded-[32px] w-full max-w-sm relative shadow-[0_0_0_1px_rgba(255,255,255,0.05),_0_32px_64px_rgba(0,0,0,0.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-white/30 hover:text-white/80 text-xl transition-colors"
        >
          ✕
        </button>
        <h3 className="text-xl font-black mb-1 text-white">Schedule Task</h3>
        <p className="text-sm text-white/40 mb-5 font-medium truncate">
          {task.title}
        </p>
        <div className="mb-4">
          <label className="text-xs font-bold text-white/30 uppercase">
            Date
          </label>
          <input
            type="date"
            id="quick-schedule-date"
            defaultValue={format(new Date(), "yyyy-MM-dd")}
            className="w-full bg-white/5 border border-white/10 text-white p-2 rounded-xl mt-1 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <div className="mb-6">
          <label className="text-xs font-bold text-white/30 uppercase">
            Time
          </label>
          <input
            type="time"
            id="quick-schedule-time"
            defaultValue={format(new Date(), "HH:mm")}
            className="w-full bg-white/5 border border-white/10 text-white p-2 rounded-xl mt-1 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <button
          onClick={handleSchedule}
          className="w-full bg-white text-gray-900 py-4 rounded-2xl font-bold hover:bg-white/90 transition-all"
        >
          Schedule Task
        </button>
      </div>
    </div>
  );
}