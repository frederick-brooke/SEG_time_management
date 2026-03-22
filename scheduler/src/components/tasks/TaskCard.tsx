import * as React from "react";
import { Button } from "components/ui/button";
import { Checkbox } from "components/ui/checkbox";
import { TaskActions } from "@/src/components/task-actions";
import { ArrowRight, ArrowLeft, GripVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { getPriorityStyle } from "@/src/lib/priority";
import { LunarCard } from "../ui/lunar-card";


export function TaskCard({
  task,
  onToggle,
  onView,
  onEdit,
  onDelete,
  isDashboard = true,
  className = "",
}: {
  task: any;
  onToggle: (id:string, status: string) => void;
  onView: (task: any) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  isDashboard?: boolean;
  className?: string;
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

  React.useEffect(() => {
    if (className.includes("animate-lunar-burst")) {
      const scrollTask = () => {
        const element = document.getElementById(`task-${task.id}`);
        if (element) {      
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      };

      const timer = setTimeout(scrollTask, 150);
      const safetyTimer = setTimeout(scrollTask, 500);

      return () => {
        clearTimeout(timer);
        clearTimeout(safetyTimer);
      };
    }
  }, [className, task.id]);

  return (
    <div 
      className="block w-full"
      onClick={(e) => {
        if (isDashboard) {
          console.log("Navigating to task:", task.id);
          router.push(`/tasks?highlight=${task.id}`);
        }
      }}
    >

      <LunarCard 
        id={`task-${task.id}`}
        variant="blue"
        className={`p-6 mb-4 rounded-[3em] transition-all duration-300 relative z-10 ${
          isDashboard
            ? "cursor-pointer hover:scale-[1.02] active:scale-95 hover:ring-2 hover:ring-blue-400/30"
            : ""
        } ${className}`}

      >

        <div className={`flex flex-col gap-4 w-full ${isDashboard ? 'pointer-events-none' : 'gap-4'}`}>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col gap-1 mt-1">
              <span
                className={`text-lg font-black tracking-tight text-white leading-tight truncate ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}
              >
                {task.title}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <span
                className={`text-[12px] px-2 gap-2 py-0.5 rounded font-black uppercase tracking-tighter ${getPriorityStyle(task.priority)}`}
              >
                {task.priority}
              </span>

              {task.exam && (
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest opacity-80">
                  {task.exam.title}
                </span>
              )}

              {task.isModuleTask && (
                <span className="text-[12px] px-2 py-0.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 font-black uppercase tracking-widest">
                  📚 Module Task
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1 mt-2">
              {task.duration > 0 && (
                <span className="flex items-center gap-3 text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] opacity-90">
                  {task.duration < 60
                    ? `${task.duration}m`
                    : `${Math.floor(task.duration / 60)}h ${task.duration % 60}m`}
                </span>
              )}
              {task.dueDate && (
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-tighter">
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
            <div className="flex justify-between items-center pt-3 border-t border-white/10 w-full mt-2">
              <div className="flex items-center gap-2">
                {/* Checkbox */}
                <Checkbox
                  id={`task-${task.id}`}
                  checked={task.status === "completed"}
                  onCheckedChange={() => {
                    const next = task.status === "completed" ? "todo" : "completed";
                    onToggle(task.id, next)
                  }}
                  className="h-5 w-5 border-white/100 data-[state=checked]:bg-blue-500"
                />

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
                      <ArrowRight className="h-6 w-6 text-white/100 hover:text-white" />
                    )}
                    {task.status === "in-progress" && (
                      <ArrowLeft className="h-6 w-6 text-white/100 hover:text-white " />
                    )}
                  </Button>
                )}

              </div>
              <TaskActions
                onView={() => onView(task)}
                onEdit={() => onEdit(task.id)}
                onDelete={() => onDelete(task.id)}
                canDelete={!task.isModuleTask && !task.isGroupTask} 
                canEdit={!task.isModuleTask && !task.isGroupTask}
                strokeWidth={2.5}
                className="text-white brightness-200 contrast-150 scale-110"
              />
            </div>
          )}
        </div>
      </LunarCard>
    </div>
  );
}