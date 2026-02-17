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
}) {
  return (
    <div
      className={`flex-1 min-w-[300px] rounded-lg border p-4 ${status === "overdue" ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900" : "bg-muted/20"}`}
    >
      <div className="mb-4 pb-3 border-b">
        <h3 className="font-semibold text-base">{title}</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
        </p>
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No tasks
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
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
