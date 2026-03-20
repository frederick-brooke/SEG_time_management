'use client';

import { useState } from "react";
import { X, Settings } from "lucide-react";
import { updateModuleSettings } from "@/app/actions/module";

interface ModuleSettingsModalProps {
  module: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModuleSettingsModal({ module, onClose, onSuccess }: ModuleSettingsModalProps) {
  const [formData, setFormData] = useState({
    name: module.name,
    description: module.description || "",
    maxMembers: module.maxMembers,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError(result.error || "Failed to update settings");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Settings size={20} className="text-gray-500"/> Module Settings
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Module Name</label>
            <input 
              type="text" required value={formData.name} 
              onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
              className="w-full border border-gray-200 bg-gray-50 p-3 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none" 
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <textarea 
              rows={3} value={formData.description} 
              onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
              className="w-full border border-gray-200 bg-gray-50 p-3 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none resize-none" 
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Max Members</label>
            <input 
              type="number" min={module.memberCount} max={100} required value={formData.maxMembers} 
              onChange={(e) => setFormData({ ...formData, maxMembers: parseInt(e.target.value) || module.memberCount })} 
              className="w-full border border-gray-200 bg-gray-50 p-3 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none" 
            />
            <p className="text-xs text-gray-500 mt-1">
              Currently using {module.memberCount} of {formData.maxMembers} spots.
            </p>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
              {isSubmitting ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}