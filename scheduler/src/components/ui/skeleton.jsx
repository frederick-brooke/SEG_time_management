<<<<<<< HEAD
import { cn } from "@/src/lib/utils"
=======
import { cn } from "@/lib/utils"
>>>>>>> bf2471fab6b94f783dfc67c4c7eae67a9a95203e

function Skeleton({
  className,
  ...props
}) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props} />
  );
}

export { Skeleton }
