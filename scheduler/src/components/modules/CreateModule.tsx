'use client';

import { useState, useTransition } from "react";
import { createModule } from "@/src/app/actions/module";
import { X } from "lucide-react";

//types
interface CreateModuleProps {
  onClose: () => void;
  onSuccess?: (module: any, joinPin: string) => void;
}

//component

/**
 * Modal for creating a new module with custom settings.
 * @param {CreateModuleProps} props - Modal control props.
 * @return {JSX.Element} Create module modal.
 */
export default function CreateModule({ onClose, onSuccess }: CreateModuleProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [createdModule, setCreatedModule] = useState<any>(null);
  const [joinPin, setJoinPin] = useState<string | null>(null);

  /**
   * Handles module creation form submission.
   * @param {FormData} formData - Form data with module details.
   * @return {void}
   */
  const handleSubmit = async (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await createModule(formData);
      if (result.success && result.module && result.joinPin) {
        setCreatedModule(result.module);
        setJoinPin(result.joinPin);
        if (onSuccess) onSuccess(result.module, result.joinPin);
      } else {
        setError(result.error || "Failed to create module");
      }
    });
  };

  /**
   * Copies the join PIN to clipboard.
   * @return {void}
   */
  const copyPin = () => {
    if (joinPin) navigator.clipboard.writeText(joinPin);
  };

  // Success state
  if (createdModule && joinPin) {
    return (
      <div className="lunar-overlay">
        <div className="lunar-card p-8 max-w-md w-full text-center">
          <div className="bg-emerald-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
            <span className="text-3xl">✅</span>
          </div>
          <h2 className="lunar-header mb-2">Module Created!</h2>
          <p className="lunar-value mb-6">Share the PIN with participants to join</p>

          <div className="bg-white/5 rounded-xl p-6 mb-6 border border-white/10">
            <p className="lunar-label mb-3">Join PIN</p>
            <div className="flex items-center justify-center gap-3">
              <code className="text-3xl font-mono font-black text-blue-400 tracking-wider drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                {joinPin}
              </code>
              <button onClick={copyPin} className="lunar-button-primary text-xs">
                Copy
              </button>
            </div>
          </div>

          <button onClick={onClose} className="lunar-button-ghost w-full">
            Done
          </button>
        </div>
      </div>
    );
  }

  // Create form
  return (
    <div className="lunar-overlay">
      <div className="lunar-card p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="lunar-header">Create New Module</h2>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="lunar-label">Module Name <span className="text-red-400">*</span></label>
            <input
              type="text" name="name" required maxLength={100}
              placeholder="e.g., Computer Science 101"
              className="lunar-input w-full p-3 rounded-xl mt-1"
            />
          </div>

          <div>
            <label className="lunar-label">Description</label>
            <textarea
              name="description" rows={3} maxLength={500}
              placeholder="Optional description..."
              className="lunar-input w-full p-3 rounded-xl mt-1 resize-none"
            />
          </div>

          <div>
            <label className="lunar-label">Max Members</label>
            <input
              type="number" name="maxMembers" min={2} max={100} defaultValue={50}
              className="lunar-input w-full p-3 rounded-xl mt-1"
            />
            <p className="text-[10px] text-white/30 mt-1 font-medium">Between 2 and 100 members</p>
          </div>

          {error && (
            <div className="lunar-item-error px-4 py-3 rounded-lg border text-sm">{error}</div>
          )}

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} disabled={isPending}
              className="flex-1 lunar-button-ghost disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={isPending}
              className="flex-1 lunar-button-primary disabled:opacity-50 disabled:cursor-not-allowed">
              {isPending ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}