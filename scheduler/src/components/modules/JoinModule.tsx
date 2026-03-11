'use client';

import { useState, useTransition } from "react";
import { joinModule } from "@/src/app/actions/module";
import { X } from "lucide-react";

interface JoinModuleProps {
  onClose: () => void;
  onSuccess?: (module: any) => void;
}

/**
 * Modal for joining an existing module using join PIN
 * @param {JoinModuleProps} props - Modal control props
 * @return {JSX.Element} - Join module modal
 */
export default function JoinModule({ onClose, onSuccess }: JoinModuleProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [pin, setPin] = useState("");

  /**
   * Handles join module form submission
   * @param {React.FormEvent} e - Form event
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
   * Handles PIN input - auto-uppercase and limit to 6 chars
   */
  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().slice(0, 6);
    setPin(value);
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Join Module</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* PIN Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Enter Join PIN
            </label>
            <input
              type="text"
              value={pin}
              onChange={handlePinChange}
              placeholder="AB12CD"
              maxLength={6}
              required
              className="w-full border border-gray-200 bg-gray-50 p-4 rounded-lg text-center text-2xl font-mono font-bold tracking-widest uppercase focus:ring-2 focus:ring-blue-600 focus:border-transparent focus:outline-none transition-all"
            />
            <p className="text-xs text-gray-500 mt-2 text-center">
              6-character code (letters and numbers)
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || pin.length !== 6}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "Joining..." : "Join"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}