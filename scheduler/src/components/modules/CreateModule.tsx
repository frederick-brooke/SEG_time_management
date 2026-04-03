/**
 * @file CreateModule.tsx
 * @description A modal component that allows users (typically instructors or administrators) 
 * to create a new module. Handles form submission, communicates with the server action, 
 * and displays a success screen with a copyable join PIN.
 */
'use client';

import { Button } from "@/components/ui/Button";
import { useState, useTransition } from "react";
import { createModule } from "@/app/actions/module";
import { X } from "lucide-react";

/**
 * Represents the core data of a created module.
 */
interface ModuleData {
  id: string;
  name: string;
  [key: string]: any;
}

/**
 * Props for the CreateModule component.
 */
interface CreateModuleProps {
  onClose: () => void;
  onSuccess?: (module: ModuleData, joinPin: string) => void;
}

/**
 * Props for the internal CreateForm sub-component.
 */
interface CreateFormProps {
  onSubmit: (formData: FormData) => void;
  onClose: () => void;
  isPending: boolean;
  error: string | null;
}

/**
 * Props for the internal SuccessScreen sub-component.
 */
interface SuccessScreenProps {
  joinPin: string;
  onClose: () => void;
  copyPin: () => void;
}

/**
 * Renders the success state displaying the generated Join PIN.
 *
 * @param {SuccessScreenProps} props - Component props.
 * @returns {JSX.Element} The success screen UI.
 */
function SuccessScreen({ joinPin, onClose, copyPin }: SuccessScreenProps) {
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
            <Button onClick={copyPin} className="lunar-button-primary text-xs">Copy</Button>
          </div>
        </div>

        <Button onClick={onClose} className="lunar-button-ghost w-full">Done</Button>
      </div>
    </div>
  );
}

/**
 * Renders the form for creating a new module.
 *
 * @param {CreateFormProps} props - Component props.
 * @returns {JSX.Element} The creation form UI.
 */
function CreateForm({ onSubmit, onClose, isPending, error }: CreateFormProps) {
  return (
    <div className="lunar-overlay">
      <div className="lunar-card p-6 max-w-md w-full">
        <header className="flex items-center justify-between mb-6">
          <h2 className="lunar-header">Create New Module</h2>
          <Button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <X size={24} />
          </Button>
        </header>

        <form action={onSubmit} className="space-y-4">
          <div>
            <label className="lunar-label">Module Name <span className="text-red-400">*</span></label>
            <input type="text" name="name" required maxLength={100} placeholder="e.g., Computer Science 101" className="lunar-input w-full p-3 rounded-xl mt-1" />
          </div>

          <div>
            <label className="lunar-label">Description</label>
            <textarea name="description" rows={3} maxLength={500} placeholder="Optional description..." className="lunar-input w-full p-3 rounded-xl mt-1 resize-none" />
          </div>

          <div>
            <label className="lunar-label">Max Members</label>
            <input type="number" name="maxMembers" min={2} max={100} defaultValue={50} className="lunar-input w-full p-3 rounded-xl mt-1" />
            <p className="text-[10px] text-white/30 mt-1 font-medium">Between 2 and 100 members</p>
          </div>

          {error && <div className="lunar-item-error px-4 py-3 rounded-lg border text-sm">{error}</div>}

          <div className="flex gap-3 pt-4">
            <Button type="button" onClick={onClose} disabled={isPending} className="flex-1 lunar-button-ghost disabled:opacity-50">Cancel</Button>
            <Button type="submit" disabled={isPending} className="flex-1 lunar-button-primary disabled:opacity-50 disabled:cursor-not-allowed">
              {isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Modal for creating a new module with custom settings.
 * Routes between the creation form and the success screen.
 *
 * @param {CreateModuleProps} props - Modal control props.
 * @returns {JSX.Element} Create module modal or success screen.
 */
export default function CreateModule({ onClose, onSuccess }: CreateModuleProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [createdModule, setCreatedModule] = useState<ModuleData | null>(null);
  const [joinPin, setJoinPin] = useState<string | null>(null);

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

  const copyPin = () => {
    if (joinPin) navigator.clipboard.writeText(joinPin);
  };

  if (createdModule && joinPin) {
    return <SuccessScreen joinPin={joinPin} onClose={onClose} copyPin={copyPin} />;
  }

  return <CreateForm onSubmit={handleSubmit} onClose={onClose} isPending={isPending} error={error} />;
}