/**
 * @file useUndoDelete.ts
 *
 * Hook for managing the undo banner shown after a calendar event is deleted.
 */

import { useState, useRef } from "react";
import { restoreEvent } from "./undoApi";

export function useUndoDelete(refreshEvents: () => Promise<any[]>) {
  const [lastDeleted, setLastDeleted] = useState<any | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const undoTimer = useRef<NodeJS.Timeout | null>(null);

  const triggerUndo = (event: any) => {
    setLastDeleted(event);
    setShowUndo(true);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setShowUndo(false), 8000);
  };

  const handleUndo = async () => {
    if (!lastDeleted) return;
    await restoreEvent(lastDeleted);
    setShowUndo(false);
    setLastDeleted(null);
    refreshEvents();
  };

  return { showUndo, handleUndo, triggerUndo, dismissUndo: () => setShowUndo(false) };
}