import { TaskCard } from "./TaskCard";

export function TaskColumn({
  title,
  tasks,
  status,
  onToggle,
  onView,
  onEdit,
  onDelete,
  getPriorityStyle,
  highlightId,
}) {
  return (
    <div
      className={`flex-1 min-w-[300px] rounded-lg border p-4 flex flex-col h-[calc(100vh-380px)] ${
        status === "overdue" ? 
          "bg-red-500/5 border-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.05)]" 
          : "bg-white/[0.03] border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.02)]"
        }`}
    >
      <div className="mb-6 flex justify-between items-end border-b border-white/5 gap-1 px-2">
        <h3 className={`font-black text-[11px] uppercase tracking-[0.4em] ${status === 'overdue' ? 'text-red-400' : 'text-white/80'}`}>
          {title}
        </h3>
        <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">
          {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
        </p>
      </div>

      <div className="space-y-4 overflow-y-auto pr-2 flex-1 custom-scrollbar">
        {tasks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No tasks
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isDashboard={false}
              className={String(highlightId) === String(task.id) ? "animate-lunar-burst" : ""}
              onToggle={onToggle}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              getPriorityStyle={getPriorityStyle}
            />
          ))
        )}
      </div>
    </div>
  );
}
