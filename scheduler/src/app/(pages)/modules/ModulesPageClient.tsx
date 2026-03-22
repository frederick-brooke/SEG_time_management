'use client';

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ModuleCard } from "components/modules/ModuleCard";
import CreateModule from "components/modules/CreateModule";
import JoinModule from "components/modules/JoinModule";
import { Plus, LogIn, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import LunarThemeWrapper from "@/components/layout/LunarThemeWrapper";

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
  creator: { username: string; fname?: string; lname?: string };
}

interface ModulesPageClientProps {
  modules: ModuleItem[];
}

type SortKey = 'name-asc' | 'name-desc' | 'members-asc' | 'members-desc' | 'newest' | 'oldest';

//constants
const PAGE_SIZE = 10;

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'newest',       label: 'Newest first'   },
  { value: 'oldest',       label: 'Oldest first'   },
  { value: 'name-asc',     label: 'Name A → Z'     },
  { value: 'name-desc',    label: 'Name Z → A'     },
  { value: 'members-desc', label: 'Most members'   },
  { value: 'members-asc',  label: 'Fewest members' },
];

//helpers

/**
 * Sorts an array of module objects based on the selected sorting key.
 * @param {ModuleItem[]} modules - The unsorted array of module items.
 * @param {SortKey} key - The criteria used to sort the modules.
 * @return {ModuleItem[]} A new sorted array of module items.
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

//main component

/**
 * Client component for the modules list page.
 * Handles displaying module cards, sorting, pagination, and triggering create/join modals.
 * @param {ModulesPageClientProps} props - Component props.
 * @return {JSX.Element} The rendered modules page UI.
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
   * Updates the sort state, resets pagination to page 1, and closes the dropdown.
   * @param {SortKey} key - The newly selected sort criteria.
   * @return {void}
   */
  const handleSort = (key: SortKey) => {
    setSortKey(key);
    setPage(1);
    setShowSortMenu(false);
  };

  return (
    <LunarThemeWrapper>
      <div className="lunar-page">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="lunar-page-title">My Modules</h1>
            <p className="lunar-page-subtitle">Create or join modules to collaborate with others</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button onClick={() => setShowJoin(true)} className="lunar-button-ghost flex items-center gap-2">
              <LogIn size={16} /> Join Module
            </button>
            <button onClick={() => setShowCreate(true)} className="lunar-button-primary flex items-center gap-2">
              <Plus size={16} /> Create Module
            </button>
          </div>
        </div>

        {initialModules.length > 0 ? (
          <>
            {/* Controls row */}
            <div className="flex items-center justify-between">
              <p className="lunar-label">
                {sorted.length} module{sorted.length !== 1 ? 's' : ''}
                {totalPages > 1 && ` — page ${page} of ${totalPages}`}
              </p>

              {/* Sort dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowSortMenu((v) => !v)}
                  className="lunar-button-ghost flex items-center gap-2"
                >
                  <ArrowUpDown size={14} /> {currentSortLabel}
                </button>
                {showSortMenu && (
                  <div className="absolute right-0 mt-1 w-48 bg-[#0a0f1d] border border-white/10 rounded-xl shadow-2xl z-10 overflow-hidden">
                    {SORT_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleSort(option.value)}
                        className={`w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors ${
                          sortKey === option.value
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'text-white/50 hover:bg-white/5 hover:text-white'
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
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-white/10 text-white/40 hover:bg-white/5 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-lg text-xs font-black uppercase tracking-widest transition-colors ${
                      p === page
                        ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]'
                        : 'border border-white/10 text-white/40 hover:bg-white/5'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border border-white/10 text-white/40 hover:bg-white/5 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="lunar-card p-12 text-center flex flex-col items-center">
            <div className="bg-blue-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
              <span className="text-4xl">📚</span>
            </div>
            <h3 className="lunar-header mb-2">No modules yet</h3>
            <p className="lunar-value">Create a module or join one with a PIN</p>
          </div>
        )}

      </div>

      {showCreate && (
        <CreateModule onClose={() => setShowCreate(false)} onSuccess={() => router.refresh()} />
      )}
      {showJoin && (
        <JoinModule onClose={() => setShowJoin(false)} onSuccess={() => router.refresh()} />
      )}
    </LunarThemeWrapper>
  );
}