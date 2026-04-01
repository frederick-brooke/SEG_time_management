/**
 * Confirmation modal for permanently deleting a task.
 * @param {boolean} isOpen Whether the dialog is visible or not.
 * @param {Function} onConfirm Callback triggered when the user confirms deletion.
 * @param {Function} onCancel Callback triggered when the user cancels.
 */
export function DeleteTaskDialog({ isOpen, onConfirm, onCancel }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xl z-[9999]" onClick={onCancel}>
      <div className="lunar-glass p-8 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <h3 className="lunar-header text-xl mb-2">Delete Task?</h3>
          <p className="lunar-value mb-8">This will permanently delete this task. This cannot be undone.</p>
          <div className="flex gap-3">
            <Button onClick={onCancel} className="flex-1 lunar-button-ghost">Cancel</Button>
            <Button onClick={onConfirm} className="flex-1 bg-red-500/20 text-red-400 border border-red-500/30 font-black uppercase tracking-widest text-xs py-2 rounded-xl hover:bg-red-500/30 transition-all">Delete</Button>
        </div>
      </div>
    </div>
  );
}
