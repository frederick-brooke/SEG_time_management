'use client';

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ModuleCard } from "components/modules/ModuleCard";
import CreateModule from "components/modules/CreateModule";
import JoinModule from "components/modules/JoinModule";
import { Plus, LogIn, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";

//types
interface ModuleItem {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  maxMembers: number;
  userRole: string;
  joinPin?: string;
  createdAt: Date;
  creator: {
    username: string;
    fname?: string;
    lname?: string;
  };
}

interface ModulesPageClientProps {
  modules: ModuleItem[];
}

type SortKey = 'name-asc' | 'name-desc' | 'members-asc' | 'members-desc' | 'newest' | 'oldest';

//constants
const PAGE_SIZE = 10;

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'newest',       label: 'Newest first'      },
  { value: 'oldest',       label: 'Oldest first'      },
  { value: 'name-asc',     label: 'Name A → Z'        },
  { value: 'name-desc',    label: 'Name Z → A'        },
  { value: 'members-desc', label: 'Most members'      },
  { value: 'members-asc',  label: 'Fewest members'    },
];


/**
 * Sorts a list of modules by the given sort key
 * @param {ModuleItem[]} modules - Unsorted module list
 * @param {SortKey} key - Sort criteria
 * @return {ModuleItem[]} - Sorted copy of the module list
 */
function sortModules(modules: ModuleItem[], key: SortKey): ModuleItem[] {
  const copy = [...modules];
  switch (key) {
    case 'name-asc':     return copy.sort((a, b) => a.name.localeCompare(b.name));
    case 'name-desc':    return copy.sort((a, b) => b.name.localeCompare(a.name));
    case 'members-desc': return copy.sort((a, b) => b.memberCount - a.memberCount);
    case 'members-asc':  return copy.sort((a, b) => a.memberCount - b.memberCount);
    case 'newest':       return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    case 'oldest':       return copy.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    default:             return copy;
  }
}


/**
 * Client component for the modules list page with sorting, pagination, and create/join modals
 * @param {ModulesPageClientProps} props - Initial modules data from server
 * @return {JSX.Element} - Modules page with controls and modals
 */
export default function ModulesPageClient({ modules: initialModules }: ModulesPageClientProps) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const [page, setPage] = useState(1);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const sorted = useMemo(() => sortModules(initialModules, sortKey), [initialModules, sortKey]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageStart = (page - 1) * PAGE_SIZE;
  const paginated = sorted.slice(pageStart, pageStart + PAGE_SIZE);

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sortKey)?.label ?? 'Sort';

  /**
   * Changes the sort key and resets to page 1
   * @param {SortKey} key - New sort criteria
   * @return {void}
   */
  const handleSort = (key: SortKey) => {
    setSortKey(key);
    setPage(1);
    setShowSortMenu(false);
  };

  return (
    <>
      <div className="flex flex-1 flex-col gap-6 p-6 pt-0">
        <div className="max-w-5xl w-full mx-auto py-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Modules</h1>
              <p className="text-gray-500 mt-1">Create or join modules to collaborate with others</p>
            </div>

            <div className="flex gap-3 flex-wrap">
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

          {initialModules.length > 0 ? (
            <>
              {/* Controls row */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">
                  {sorted.length} module{sorted.length !== 1 ? 's' : ''}
                  {totalPages > 1 && ` — page ${page} of ${totalPages}`}
                </p>

                {/* Sort dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowSortMenu((v) => !v)}
                    className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <ArrowUpDown size={14} />
                    {currentSortLabel}
                  </button>

                  {showSortMenu && (
                    <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                      {SORT_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleSort(option.value)}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                            sortKey === option.value
                              ? 'bg-blue-50 text-blue-700 font-semibold'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Module list */}
              <div className="space-y-3">
                {paginated.map((module) => (
                  <ModuleCard key={module.id} module={module} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button
                    onClick={() => setPage((p) => p - 1)}
                    disabled={page === 1}
                    className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                        p === page
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
              <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">📚</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No modules yet</h3>
              <p className="text-gray-500 text-sm">Create a module or join one with a PIN</p>
            </div>
          )}

        </div>
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateModule
          onClose={() => setShowCreate(false)}
          onSuccess={() => router.refresh()}
        />
      )}

      {showJoin && (
        <JoinModule
          onClose={() => setShowJoin(false)}
          onSuccess={() => router.refresh()}
        />
      )}
    </>
  );
}
