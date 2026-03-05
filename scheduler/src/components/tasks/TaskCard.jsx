import * as React from "react";
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


  const subtasksList = React.useMemo(() => {
    if (!task.subtasks) return [];
    return Array.isArray(task.subtasks)
      ? task.subtasks
      : String(task.subtasks).split(',').filter(s => s.trim() !== "");
  }, [task.subtasks]);

  const [checkedList, setCheckedList] = React.useState(() => {
    const length = subtasksList.length;
    if (task.status === "completed") {
      return new Array(length).fill(true);
    }
    return new Array(length).fill(false);
});

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

          {task.exam && (
            <span className="text-[10px] px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-100 font-medium">
              {task.exam.title}
            </span>
          )}
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
        {subtasksList.length > 0 && (
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
                    checked={checkedList[i] || false}
                    className="h-3 w-3 rounded border-gray-300 pointer-events-auto" 
                    onChange={(e) => {
                      e.stopPropagation()

                      const isCheckedNow = e.target.checked;
                      const newList = [...checkedList];
                      newList[i] = isCheckedNow;
                      setCheckedList(newList);

                      const total = newList.length;
                      const currentCheckedCount = newList.filter(Boolean).length;

                      if (total > 0 && currentCheckedCount === total && task.status !== "completed") {
                        onToggle(task.id, "completed");
                      }
                      else if (currentCheckedCount < total && task.status === "completed") {
                        onToggle(task.id, "in-progress");
                      }
                    }}
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
