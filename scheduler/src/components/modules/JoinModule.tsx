'use client';

import { useState, useTransition } from "react";
import { joinModule } from "@/src/app/actions/module";
import { X } from "lucide-react";

//types
interface JoinModuleProps {
  onClose: () => void;
  onSuccess?: (module: any) => void;
}

//component

/**
 * Modal for joining an existing module using a join PIN.
 * @param {JoinModuleProps} props - Modal control props.
 * @return {JSX.Element} Join module modal.
 */
export default function JoinModule({ onClose, onSuccess }: JoinModuleProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [pin, setPin] = useState("");

  /**
   * Handles join module form submission.
   * @param {React.FormEvent} e - Form event.
   * @return {void}
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (pin.trim().length !== 6) {
      setError("PIN must be 6 characters");
      return;
    }
    startTransition(async () => {
      const result = await joinModule(pin);
      if (result.success && result.module) {
        if (onSuccess) onSuccess(result.module);
        onClose();
      } else {
        setError(result.error || "Failed to join module");
      }
    });
  };

  /**
   * Auto-uppercases input and limits it to 6 characters.
   * @param {React.ChangeEvent<HTMLInputElement>} e - Input change event.
   * @return {void}
   */
  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPin(e.target.value.toUpperCase().slice(0, 6));
  };

  return (
    <div className="lunar-overlay">
      <div className="lunar-card p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="lunar-header">Join Module</h2>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="lunar-label">Enter Join PIN</label>
            <input
              type="text"
              value={pin}
              onChange={handlePinChange}
              placeholder="AB12CD"
              maxLength={6}
              required
              className="lunar-input w-full p-4 rounded-xl mt-1 text-center text-2xl font-mono font-black tracking-widest uppercase"
            />
            <p className="text-[10px] text-white/30 mt-2 text-center font-medium">
              6-character code (letters and numbers)
            </p>
          </div>

          {error && (
            <div className="lunar-item-error px-4 py-3 rounded-lg border text-sm">{error}</div>
          )}

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} disabled={isPending}
              className="flex-1 lunar-button-ghost disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={isPending || pin.length !== 6}
              className="flex-1 lunar-button-primary disabled:opacity-50 disabled:cursor-not-allowed">
              {isPending ? "Joining..." : "Join"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}