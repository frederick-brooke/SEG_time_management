"use client";
import { format } from "date-fns";

interface QuickScheduleModalProps {
  task: any;
  onClose: () => void;
  onSaved: () => void;
}

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
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 backdrop-blur-md z-[9999]"
      onClick={onClose}
    >
      <div
        className="bg-white p-8 rounded-[32px] shadow-2xl w-full max-w-sm relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-black text-xl"
        >
          ✕
        </button>
        <h3 className="text-xl font-black mb-1 text-gray-900">Schedule Task</h3>
        <p className="text-sm text-gray-500 mb-5 font-medium truncate">
          {task.title}
        </p>

        <div className="mb-4">
          <label className="text-xs font-bold text-gray-400 uppercase">
            Date
          </label>
          <input
            type="date"
            id="quick-schedule-date"
            defaultValue={format(new Date(), "yyyy-MM-dd")}
            className="w-full border p-2 rounded-xl mt-1 text-sm"
          />
        </div>
        <div className="mb-6">
          <label className="text-xs font-bold text-gray-400 uppercase">
            Time
          </label>
          <input
            type="time"
            id="quick-schedule-time"
            defaultValue={format(new Date(), "HH:mm")}
            className="w-full border p-2 rounded-xl mt-1 text-sm"
          />
        </div>

        <button
          onClick={handleSchedule}
          className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all"
        >
          Schedule Task
        </button>
      </div>
    </div>
  );
}
