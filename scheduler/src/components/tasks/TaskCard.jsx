import * as React from "react";
import { Button } from "components/ui/button";
import { Checkbox } from "components/ui/checkbox";
import { TaskActions } from "@/src/components/task-actions";
import { ArrowRight, ArrowLeft, GripVertical } from "lucide-react";
import { LunarCard } from "../ui/lunar-card";
import { useRouter } from "next/navigation";

export function TaskCard({
  task,
  onToggle,
  onView,
  onEdit,
  onDelete,
  getPriorityStyle,
  isDashboard = true,
  className = "",
}) {

  const router = useRouter();

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
    <LunarCard variant="blue"
            className={`p-6 mb-4 rounded-[3em] transition-all duration-300 ${
              isDashboard
                ? "cursor-pointer hover:scale-[1.02] active:scale-95 hover:ring-2 hover:ring-blue-400/30"
                : ""
            } ${className}`}
            onClick={() => {
                isDashboard && router.push(`/tasks?highlight=${task.id}`)
            }}
      >

      <div className={`flex items-center ${isDashboard ? 'gap-0' : 'gap-4'}`}>
        {!isDashboard && (
          <>
          {/* Arrows */}
          {(task.status === "todo" || task.status === "in-progress") && (
            <Button
              variant="ghost" 
              size="icon"
              className="h-8 w-8 cursor-pointer shrink-0 hover:bg-muted"
              onClick={(e) => {
                if (isDashboard) {
                  router.push(`/tasks?highlight=${task.id}`)
                }
                e.stopPropagation();
                let nextStatus = task.status;
                if (task.status === "todo") nextStatus = "in-progress";
                else if (task.status === "in-progress") nextStatus = "todo";
                onToggle(task.id, nextStatus);
              }}
            >
              {task.status === "todo" && (
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              )}
              {task.status === "in-progress" && (
                <ArrowLeft className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          )}

          {/* Checkbox */}
          <Checkbox
            id={`task-${task.id}`}
            checked={task.status === "completed"}
            onCheckedChange={() => {
              const next = task.status === "completed" ? "todo" : "completed";
              onToggle(task.id, next)
            }}
            className="shrink-0 h-4 w-4"
          />
        </>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex flex-row flex-wrap gap-2 mt-1">
            <span
              className={`text-sm font-medium truncate ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}
            >
              {task.title}
            </span>
            <span
              className={`text-[12px] px-1.5 py-0.5 rounded-full border font-semibold ${getPriorityStyle(task.priority)}`}
            >
              {task.priority}
            </span>

            {task.exam && (
              <span className="text-[12px] px-2 py-0.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 font-black uppercase tracking-widest">
                {task.exam.title}
              </span>
            )}

            {task.isModuleTask && (
              <span className="text-[12px] px-2 py-0.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 font-black uppercase tracking-widest">
                📚 Module Task
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            {task.duration > 0 && (
              <span className="flex items-center gap-3 mt-2 text-[10px] font-bold text-white/40 uppercase tracking-tighter">
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
          {!isDashboard && subtasksList.length > 0 && (
            <div className="mt-2 pt-2 border-t border-dashed border-muted space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Subtasks</p>
              <div className="flex flex-col gap-2 max-h-[80px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300">
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
        
        {!isDashboard && (
          <TaskActions
            onView={() => onView(task)}
            onEdit={() => onEdit(task.id)}
            onDelete={() => onDelete(task.id)}
            canDelete={!task.isModuleTask}
          />
        )}
      </div>
    </LunarCard>
  );
}
