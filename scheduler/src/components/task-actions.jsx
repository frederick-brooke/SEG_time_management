import { Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "components/ui/button";

export function TaskActions({ onView, onEdit, onDelete }) {
    return (
        <div className="flex items-center gap-0.5 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={onView}
                  title="View Task"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={onEdit}
                  title="Edit Task"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={onDelete}
                  title="Delete Task"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
        </div>
    )
}