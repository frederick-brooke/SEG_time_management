import { Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "components/ui/button";

export function TaskActions({ onView, onEdit, onDelete, canDelete=true, canEdit=true, className="", strokeWidth=2 }) {
    return (
        <div className="flex items-center gap-0.5 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-white hover:bg-white-100"
                  onClick={onView}
                  title="View Task"
                >
                  <Eye className="h-4 w-4 hover:bg-white-100" strokeWidth={strokeWidth} />
                </Button>
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-white hover:bg-white-100"
                    onClick={onEdit}
                    title="Edit Task"
                  >
                    <Pencil className="h-4 w-4 text-white hover:bg-white-100" strokeWidth={strokeWidth} />
                  </Button>
                )}
                {canDelete && (
                    <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-white hover:bg-white-100"
                    onClick={onDelete}
                    title="Delete Task"
                  >
                    <Trash2 className="h-4 w-4 hover:bg-white-100" strokeWidth={strokeWidth} />
                  </Button>
                )}
        </div>
    )
}