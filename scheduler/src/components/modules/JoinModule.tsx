/**
 * @file JoinModule.tsx
 * @description A modal interface allowing users to join an existing module by entering 
 * a 6-character alphanumeric PIN. Handles client-side validation, server action submission, 
 * and loading/error states.
 */

'use client';

import { Button } from "@/components/ui/Button";
import { useState, useTransition } from "react";
import { joinModule } from "@/app/actions/module";
import { X } from "lucide-react";

/**
 * Represents the core data of a module returned after successfully joining.
 */
interface ModuleData {
  id: string;
  [key: string]: any;
}

/**
 * Props for the JoinModule component.
 */
interface JoinModuleProps {
  onClose: () => void;
  onSuccess?: (module: ModuleData) => void;
}

/**
 * Renders the header of the modal.
 *
 * @param {{ onClose: () => void }} props - Component props.
 * @returns {JSX.Element} The modal header.
 */
function ModalHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="lunar-header">Join Module</h2>
      <Button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
        <X size={24} />
      </Button>
    </div>
  );
}

/**
 * Renders the PIN input field with its label and helper text.
 *
 * @param {{ pin: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }} props - Component props.
 * @returns {JSX.Element} The input block.
 */
function PinInputBlock({ pin, onChange }: { pin: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div>
      <label className="lunar-label">Enter Join PIN</label>
      <input
        type="text"
        value={pin}
        onChange={onChange}
        placeholder="AB12CD"
        maxLength={6}
        required
        className="lunar-input w-full p-4 rounded-xl mt-1 text-center text-2xl font-mono font-black tracking-widest uppercase"
      />
      <p className="text-[10px] text-white/30 mt-2 text-center font-medium">
        6-character code (letters and numbers)
      </p>
    </div>
  );
}

/**
 * Renders the cancel and submit action buttons.
 *
 * @param {{ onClose: () => void; isPending: boolean; isValid: boolean }} props - Component props.
 * @returns {JSX.Element} The action buttons.
 */
function ActionButtons({ onClose, isPending, isValid }: { onClose: () => void; isPending: boolean; isValid: boolean }) {
  return (
    <div className="flex gap-3 pt-4">
      <Button type="button" onClick={onClose} disabled={isPending} className="flex-1 lunar-button-ghost disabled:opacity-50">
        Cancel
      </Button>
      <Button type="submit" disabled={isPending || !isValid} className="flex-1 lunar-button-primary disabled:opacity-50 disabled:cursor-not-allowed">
        {isPending ? "Joining..." : "Join"}
      </Button>
    </div>
  );
}

/**
 * Modal for joining an existing module using a join PIN.
 *
 * @param {JoinModuleProps} props - Modal control props.
 * @returns {JSX.Element} Join module modal.
 */
export default function JoinModule({ onClose, onSuccess }: JoinModuleProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [pin, setPin] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (pin.trim().length !== 6) return setError("PIN must be 6 characters");
    
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

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPin(e.target.value.toUpperCase().slice(0, 6));
  };

  return (
    <div className="lunar-overlay">
      <div className="lunar-card p-6 max-w-md w-full">
        <ModalHeader onClose={onClose} />
        <form onSubmit={handleSubmit} className="space-y-4">
          <PinInputBlock pin={pin} onChange={handlePinChange} />
          {error && <div className="lunar-item-error px-4 py-3 rounded-lg border text-sm">{error}</div>}
          <ActionButtons onClose={onClose} isPending={isPending} isValid={pin.length === 6} />
        </form>
      </div>
    </div>
  );
}