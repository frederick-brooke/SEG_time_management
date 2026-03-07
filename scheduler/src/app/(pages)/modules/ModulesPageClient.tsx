'use client';

import { useState } from "react";
import { ModuleCard } from "@/src/components/modules/ModuleCard";
import CreateModule from "@/src/components/modules/CreateModule";
import JoinModule from "@/src/components/modules/JoinModule";
import { SiteHeader } from "components/site-header";
import { Plus, LogIn } from "lucide-react";

interface ModulesPageClientProps {
  modules: any[];
}

/**
 * Client component for modules list page with create/join functionality
 * @param {ModulesPageClientProps} props - Initial modules data
 * @return {JSX.Element} - Modules page with modals
 */
export default function ModulesPageClient({ modules: initialModules }: ModulesPageClientProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  return (
    <>
      <SiteHeader />
      
      <div className="flex flex-1 flex-col gap-6 p-6 pt-0">
        <div className="max-w-5xl w-full mx-auto py-8">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Modules</h1>
              <p className="text-gray-500 mt-1">
                Create or join modules to collaborate with others
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowJoin(true)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                <LogIn size={18} />
                <span>Join Module</span>
              </button>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <Plus size={18} />
                <span>Create Module</span>
              </button>
            </div>
          </div>

          {/* Modules List */}
          {initialModules.length > 0 ? (
            <div className="space-y-3">
              {initialModules.map((module) => (
                <ModuleCard key={module.id} module={module} />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
              <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">📚</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No modules yet</h3>
              <p className="text-gray-500 mb-6">
                Create your first module or join an existing one using a PIN
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowJoin(true)}
                  className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  <LogIn size={18} />
                  <span>Join Module</span>
                </button>
                <button
                  onClick={() => setShowCreate(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  <Plus size={18} />
                  <span>Create Module</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateModule
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setTimeout(() => window.location.reload(), 1500);
          }}
        />
      )}

      {showJoin && (
        <JoinModule
          onClose={() => setShowJoin(false)}
          onSuccess={() => {
            window.location.reload();
          }}
        />
      )}
    </>
  );
}