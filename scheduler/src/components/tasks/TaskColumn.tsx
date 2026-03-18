import { TaskCard } from "./TaskCard";

interface TaskColumnProps {
  title:       string;
  tasks:       any[];
  status:      string;
  onToggle:    (id: string, status?: string) => void;
  onView:      (task: any) => void;
  onEdit:      (id: string) => void;
  onDelete:    (id: string) => void;
  categories?: { id: string; name: string; color: string }[];
  events?:     { id: string; title: string; category: string }[];
}

export function TaskColumn({
  title, tasks, status,
  onToggle, onView, onEdit, onDelete,
  categories = [], events = [],
}: TaskColumnProps) {
  return (
    <div className={`flex-1 min-w-[300px] rounded-xl border p-4 ${
      status === "overdue"
        ? "bg-red-50 border-red-200"
        : "bg-gray-50 border-gray-200"
    }`}>
      <div className="mb-4 pb-3 border-b border-gray-200">
        <h3 className="font-bold text-sm text-gray-800">{title}</h3>
        <p className="text-xs text-gray-400 mt-0.5">{tasks.length} {tasks.length === 1 ? "task" : "tasks"}</p>
      </div>
      <div className="flex flex-col gap-2">
        {tasks.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">No tasks</div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={onToggle}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              categories={categories}
              events={events}
            />
          ))
        )}
      </div>
    </div>
  );
}