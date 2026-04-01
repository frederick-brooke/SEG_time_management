'use client';

/**
 * Client-side Modules page.
 * Handles sorting, pagination, and UI state for creating/joining modules,
 * and renders the paginated list of ModuleCard components.
 */

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ModuleCard } from "@/components/modules/ModuleCard";
import CreateModule from "@/components/modules/CreateModule";
import JoinModule from "@/components/modules/JoinModule";
import { Plus, LogIn, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import LunarThemeWrapper from "@/components/layout/LunarThemeWrapper";


// Global constants for pagination sizing and sorting keys.
const PAGE_SIZE = 8;
type SortKey = 'name-asc' | 'name-desc' | 'members-asc' | 'members-desc' | 'newest' | 'oldest';

// Configuration for the sorting dropdown labels and values.
const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'newest',       label: 'Newest first'   },
  { value: 'oldest',       label: 'Oldest first'   },
  { value: 'name-asc',     label: 'Name A → Z'     },
  { value: 'name-desc',    label: 'Name Z → A'     },
  { value: 'members-desc', label: 'Most members'   },
  { value: 'members-asc',  label: 'Fewest members' },
];

/**
 * Sorts an array of module objects based on a specific criteria key.
 * @param {any[]} modules - The raw array of modules fetched from the database.
 * @param {SortKey} key - The sorting criteria to apply (e.g., 'name-asc', 'newest').
 * @returns {any[]} A new array containing the sorted module items.
 */
function sortModules(modules: any[], key: SortKey): any[] {
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
 * Renders a consistent pagination footer with numeric page buttons.
 * @param {object} props - Component properties.
 * @param {number} props.page - The current active page index.
 * @param {number} props.total - The total number of pages available.
 * @param {function} props.onPageChange - Callback triggered when a new page is selected.
 * @returns {JSX.Element} The pagination navigation UI.
 */
function Pagination({ page, total, onPageChange }: { page: number; total: number; onPageChange: (p: number) => void }) {
  const safeTotal = Math.max(total, 1);
  
  return (
    <div className="flex items-center justify-center gap-2 mt-8 py-4 border-t border-white/5">
      <button 
        onClick={() => onPageChange(page - 1)} 
        disabled={page === 1} 
        className="lunar-button-ghost px-3 disabled:opacity-10 transition-colors"
      >
        <ChevronLeft size={16} />
      </button>
      
      {Array.from({ length: safeTotal }, (_, i) => i + 1).map((p) => (
        <button 
          key={p} 
          onClick={() => onPageChange(p)} 
          className={`w-10 h-10 rounded-xl text-[12px] font-bold transition-all border ${
            p === page
              ? "bg-white/10 text-white border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
              : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white"
          }`}
        >
          {p}
        </button>
      ))}
      
      <button 
        onClick={() => onPageChange(page + 1)} 
        disabled={page === safeTotal} 
        className="lunar-button-ghost px-3 disabled:opacity-10 transition-colors"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

/**
 * Client-side orchestrator for the modules listing page.
 * @param {object} props - Component properties.
 * @param {any[]} props.modules - Initial array of modules passed from the server component.
 * @returns {JSX.Element} The complete modules page interface.
 */
export default function ModulesPageClient({ modules: initialModules }: { modules: any[] }) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const [page, setPage] = useState(1);
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Calculates sorted data and pagination boundaries
  const sorted = useMemo(() => sortModules(initialModules, sortKey), [initialModules, sortKey]);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const startIndex = (page - 1) * PAGE_SIZE;
  const paginated = sorted.slice(startIndex, startIndex + PAGE_SIZE);
  
  const currentCount = paginated.length;
  const totalCount = sorted.length;
  const rangeLabel = totalCount > 0 
    ? `Showing ${startIndex + 1}-${startIndex + currentCount} of ${totalCount}` 
    : "No modules found";
  const pageLabel = `Page ${page}/${Math.max(totalPages, 1)}`;

  return (
    <LunarThemeWrapper>
      <div className="lunar-page">
        {/* Page Title and Global Actions */}
        <div className="flex flex-col items-center sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="text-center sm:text-left">
            <h1 className="lunar-page-title">My Modules</h1>
            <p className="lunar-page-subtitle">Collaborate with peers on shared goals</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowJoin(true)} className="lunar-button-ghost flex items-center gap-2">
              <LogIn size={16} /> Join
            </button>
            <button onClick={() => setShowCreate(true)} className="lunar-button-primary flex items-center gap-2">
              <Plus size={16} /> Create
            </button>
          </div>
        </div>

        {/* Data Metadata and Sort Controls */}
        <div className="flex justify-between items-center mb-6 bg-white/5 p-4 rounded-xl border border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <span className="lunar-label !text-white">{rangeLabel}</span>
            <span className="hidden sm:block text-white/20">|</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">{pageLabel}</span>
          </div>
          
          <div className="relative">
            <button onClick={() => setShowSortMenu(!showSortMenu)} className="lunar-button-ghost text-xs flex items-center gap-2">
              <ArrowUpDown size={14} /> Sort
            </button>
            {showSortMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-[#0d1117] border border-white/10 rounded-xl z-20 shadow-2xl overflow-hidden">
                {SORT_OPTIONS.map((opt) => (
                  <button 
                    key={opt.value} 
                    onClick={() => { setSortKey(opt.value); setPage(1); setShowSortMenu(false); }} 
                    className={`w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors ${sortKey === opt.value ? 'bg-blue-600/20 text-blue-400' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Rendered List of Module Cards */}
        <div className="space-y-4 min-h-[400px]">
          {paginated.map((m) => <ModuleCard key={m.id} module={m} />)}
          {totalCount === 0 && (
            <div className="h-64 flex flex-col items-center justify-center opacity-40 italic">
              <p>No modules enrolled yet.</p>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        <Pagination page={page} total={totalPages} onPageChange={setPage} />
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