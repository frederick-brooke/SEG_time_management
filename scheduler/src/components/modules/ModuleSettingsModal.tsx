'use client';

import { useState } from "react";
import { X, Settings } from "lucide-react";
import { updateModuleSettings } from "@/app/actions/module";

//types
interface ModuleSettingsModalProps {
  module: any;
  onClose: () => void;
  onSuccess: () => void;
}

//component

/**
 * Modal for updating module name, description, and max members — owner only.
 * @param {ModuleSettingsModalProps} props - Module data and callbacks.
 * @return {JSX.Element} Module settings modal.
 */
export default function ModuleSettingsModal({ module, onClose, onSuccess }: ModuleSettingsModalProps) {
  const [formData, setFormData] = useState({
    name: module.name,
    description: module.description || "",
    maxMembers: module.maxMembers,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Submits updated module settings to the server.
   * @param {React.FormEvent} e - Form submit event.
   * @return {Promise<void>}
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await updateModuleSettings(module.id, {
      name: formData.name,
      description: formData.description,
      maxMembers: Number(formData.maxMembers),
    });

    setIsSubmitting(false);

    if (result.success) {
      onSuccess();
      onClose();
    } else {
      setError('error' in result ? result.error : "Failed to update settings");
    }
  };

  return (
    <div className="lunar-overlay z-[100]" onClick={onClose}>
      <div className="lunar-card p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>

        <div className="flex items-center justify-between mb-6">
          <h2 className="lunar-header flex items-center gap-2">
            <Settings size={18} className="text-white/40" /> Module Settings
          </h2>
          <Button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <X size={24} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="lunar-label">Module Name</label>
            <input type="text" required value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="lunar-input w-full p-3 rounded-xl mt-1" />
          </div>

          <div>
            <label className="lunar-label">Description</label>
            <textarea rows={3} value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="lunar-input w-full p-3 rounded-xl mt-1 resize-none" />
          </div>

          <div>
            <label className="lunar-label">Max Members</label>
            <input type="number" min={module.memberCount} max={100} required value={formData.maxMembers}
              onChange={(e) => setFormData({ ...formData, maxMembers: parseInt(e.target.value) || module.memberCount })}
              className="lunar-input w-full p-3 rounded-xl mt-1" />
            <p className="text-[10px] text-white/30 mt-1 font-medium">
              Currently using {module.memberCount} of {formData.maxMembers} spots.
            </p>
          </div>

          {error && (
            <div className="lunar-item-error px-4 py-3 rounded-lg border text-sm">{error}</div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" onClick={onClose} disabled={isSubmitting}
              className="flex-1 lunar-button-ghost disabled:opacity-50">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}
              className="flex-1 lunar-button-primary disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}