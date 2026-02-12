import { Button } from "components/ui/button";
import { Checkbox } from "components/ui/checkbox";
import { TaskActions } from "@/src/components/task-actions";

export function TaskCard({
  task,
  onToggle,
  onView,
  onEdit,
  onDelete,
  getPriorityStyle,
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border p-2.5 bg-card shadow-sm hover:shadow-md transition-shadow">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 cursor-grab shrink-0"
      >
        <span className="text-muted-foreground text-sm">⋮⋮</span>
      </Button>

      <Checkbox
        id={`task-${task.id}`}
        checked={task.status === "completed"}
        onCheckedChange={() => onToggle(task.id)}
        className="shrink-0 h-4 w-4"
      />

      <div className="flex-1 min-w-0">
        <div className="flex flex-col gap-1">
          <span
            className={`text-sm font-medium truncate ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}
          >
            {task.title}
          </span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full border font-semibold ${getPriorityStyle(task.priority)}`}
          >
            {task.priority}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          {task.duration > 0 && (
            <span className="text-[10px] text-muted-foreground">
              {task.duration < 60
                ? `${task.duration}m`
                : `${Math.floor(task.duration / 60)}h ${task.duration % 60}m`}
            </span>
          )}
          {task.dueDate && (
            <span className="text-xs text-muted-foreground">
              Due:{" "}
              {new Date(task.dueDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
        </div>
      </div>

      <TaskActions
        onView={() => onView(task)}
        onEdit={() => onEdit(task.id)}
        onDelete={() => onDelete(task.id)}
      />
    </div>
  );
}
