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
  attributes,
  listeners,
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border p-2.5 bg-card shadow-sm hover:shadow-md transition-shadow">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 cursor-pointer shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onToggle(task.id);
        }}
      >
        <span className="text-muted-foreground text-sm">⋮⋮</span>
      </Button>

      <Checkbox
        id={`task-${task.id}`}
        checked={task.status === "completed"}
        onCheckedChange={() => {
          const next = task.status === "completed" ? "todo" : "completed";
          onToggle(task.id, next)
        }}
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

        {/* Subtask Checklist */}
        {task.subtasks && (
          <div className="mt-2 pt-2 border-t border-dashed border-muted space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Subtasks</p>
            <div className="flex flex-col gap-2">
              {(Array.isArray(task.subtasks) 
              ? task.subtasks 
              : String(task.subtasks).split(',').filter(s => s.trim() !== "")
              ).map((sub, i) => (
                <div key={i} className="flex items-center gap-1.5 group">
                  <input 
                  type="checkbox" 
                  className="h-3 w-3 rounded border-gray-300 pointer-events-auto" 
                  onClick={(e) => e.stopPropagation()}
                  />
                  <span className="text-[10px] text-muted-foreground truncate group-hover:text-foreground">
                    {typeof sub === 'string' ? sub.trim() : (sub.title || "New Subtask")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )} 
      </div>

      <TaskActions
        onView={() => onView(task)}
        onEdit={() => onEdit(task.id)}
        onDelete={() => onDelete(task.id)}
      />
    </div>
  );
}
