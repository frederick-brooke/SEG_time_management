/**
 * @file useUndoDelete.ts
 *
 * Hook for managing the undo banner shown after a calendar event is deleted.
 * Tracks both the deleted event and the deletion mode ("single" or "full") so
 * that restoreEvent can apply the correct inverse operation.
 */

import { useState, useRef } from "react";
import { restoreEvent, type DeleteMode, type DeletableEvent } from "./undoApi";

const UNDO_TIMEOUT_MS = 8000;

interface UndoState {
  event: DeletableEvent;
  mode: DeleteMode;
}

export function useUndoDelete(refreshEvents: () => Promise<any[]>) {
  const [pendingUndo, setPendingUndo] = useState<UndoState | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const undoTimer = useRef<NodeJS.Timeout | null>(null);

  const clearTimer = () => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
  };

  const dismiss = () => {
    setShowUndo(false);
    setPendingUndo(null);
  };

  /** Call this immediately after a deletion, passing the event and how it was deleted. */
  const triggerUndo = (event: DeletableEvent, mode: DeleteMode) => {
    clearTimer();
    setPendingUndo({ event, mode });
    setShowUndo(true);
    undoTimer.current = setTimeout(dismiss, UNDO_TIMEOUT_MS);
  };

  const handleUndo = async () => {
    if (!pendingUndo) return;
    clearTimer();
    await restoreEvent(pendingUndo.event, pendingUndo.mode);
    dismiss();
    refreshEvents();
  };

  return {
    showUndo,
    triggerUndo,
    handleUndo,
    dismissUndo: dismiss,
  };
}