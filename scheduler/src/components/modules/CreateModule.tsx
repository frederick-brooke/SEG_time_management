'use client';

import { useState, useTransition } from "react";
import { createModule } from "@/src/app/actions/module";
import { X } from "lucide-react";

interface CreateModuleProps {
  onClose: () => void;
  onSuccess?: (module: any, joinPin: string) => void;
}

/**
 * Modal for creating a new module with custom settings
 * @param {CreateModuleProps} props - Modal control props
 * @return {JSX.Element} - Create module modal
 */
export default function CreateModule({ onClose, onSuccess }: CreateModuleProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [createdModule, setCreatedModule] = useState<any>(null);
  const [joinPin, setJoinPin] = useState<string | null>(null);

  /**
   * Handles module creation form submission
   * @param {FormData} formData - Form data with module details
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
   * Copies join PIN to clipboard
   */
  const copyPin = () => {
    if (joinPin) {
      navigator.clipboard.writeText(joinPin);
    }
  };

  // Success state - show created module and PIN
  if (createdModule && joinPin) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
          <div className="text-center">
            <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Module Created!</h2>
            <p className="text-gray-600 mb-6">Share the PIN with participants to join</p>
            
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Join PIN</p>
              <div className="flex items-center justify-center gap-3">
                <code className="text-3xl font-mono font-bold text-blue-600 tracking-wider">
                  {joinPin}
                </code>
                <button
                  onClick={copyPin}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-black text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Create form state
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Create New Module</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form action={handleSubmit} className="space-y-4">
          {/* Module Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Module Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              maxLength={100}
              placeholder="e.g., Computer Science 101"
              className="w-full border border-gray-200 bg-gray-50 p-3 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent focus:outline-none transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              rows={3}
              maxLength={500}
              placeholder="Optional description..."
              className="w-full border border-gray-200 bg-gray-50 p-3 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent focus:outline-none transition-all resize-none"
            />
          </div>

          {/* Max Members */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Max Members
            </label>
            <input
              type="number"
              name="maxMembers"
              min={2}
              max={100}
              defaultValue={50}
              className="w-full border border-gray-200 bg-gray-50 p-3 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent focus:outline-none transition-all"
            />
            <p className="text-xs text-gray-500 mt-1">Between 2 and 100 members</p>
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
              disabled={isPending}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}