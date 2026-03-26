'use client';

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { GroupCard } from "@/components/groups/GroupCard";
import CreateGroup from "@/components/groups/CreateGroup";
import { Plus, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import LunarThemeWrapper from "@/components/layout/LunarThemeWrapper";

/**
 * Global constants for pagination and sorting logic.
 */
const PAGE_SIZE = 8;
type SortKey = "newest" | "oldest" | "name-asc" | "name-desc" | "members-desc" | "members-asc";

/**
 * Dropdown configuration for group sorting.
 */
const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest",       label: "Newest first"   },
  { value: "oldest",       label: "Oldest first"   },
  { value: "name-asc",     label: "Name A → Z"     },
  { value: "name-desc",    label: "Name Z → A"     },
  { value: "members-desc", label: "Most members"   },
  { value: "members-asc",  label: "Fewest members" },
];

/**
 * Sorts an array of group items based on the provided sort criteria.
 * @param {any[]} groups - The unsorted list of group objects.
 * @param {SortKey} key - The criteria key used for sorting.
 * @returns {any[]} A new, sorted array of groups.
 */
function sortGroups(groups: any[], key: SortKey): any[] {
  const copy = [...groups];
  switch (key) {
    case "name-asc":     return copy.sort((a, b) => a.name.localeCompare(b.name));
    case "name-desc":    return copy.sort((a, b) => b.name.localeCompare(a.name));
    case "members-desc": return copy.sort((a, b) => b.memberCount - a.memberCount);
    case "members-asc":  return copy.sort((a, b) => a.memberCount - b.memberCount);
    case "oldest":       return copy.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
  // Default fallback (handles "newest" and any unexpected values)
  return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
/**
 * Renders the numeric pagination footer, which persists even for small lists.
 * @param {object} props - Component properties.
 * @param {number} props.page - Current page index.
 * @param {number} props.total - Total number of pages calculated.
 * @param {function} props.onPageChange - Callback to update the active page.
 * @returns {JSX.Element} The pagination navigation bar.
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
              ? "bg-white/10 text-white border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.2)]"
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
 * Orchestrates the groups page view, managing data sorting and user modals.
 * @param {object} props - Component properties.
 * @param {any[]} props.groups - Initial group data passed from the server.
 * @returns {JSX.Element} The functional groups page UI.
 */
export default function GroupsPageClient({ groups: initialGroups }: { groups: any[] }) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [page, setPage] = useState(1);
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Derives sorted and paginated data subsets
  const sorted = useMemo(() => sortGroups(initialGroups, sortKey), [initialGroups, sortKey]);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const startIndex = (page - 1) * PAGE_SIZE;
  const paginated = sorted.slice(startIndex, startIndex + PAGE_SIZE);

  // Metadata labels for UX consistency
  const currentCount = paginated.length;
  const totalCount = sorted.length;
  const rangeLabel = totalCount > 0 
    ? `Showing ${startIndex + 1}-${startIndex + currentCount} of ${totalCount}` 
    : "No groups found";
  const pageLabel = `Page ${page}/${Math.max(totalPages, 1)}`;

  return (
    <LunarThemeWrapper>
      <div className="lunar-page">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="lunar-page-title">My Groups</h1>
            <p className="lunar-page-subtitle">Collaborate with friends on shared tasks</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="lunar-button-primary !text-white !bg-white/10 !border-white/20 hover:!bg-white/20 flex items-center gap-2"
          >
            <Plus size={18} />
            <span>Create Group</span>
          </button>
        </div>

        {/* Status and Sort Control Bar */}
        <div className="flex justify-between items-center mb-6 bg-white/5 p-4 rounded-xl border border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <span className="lunar-label !text-white">{rangeLabel}</span>
            <span className="hidden sm:block text-white/20">|</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">{pageLabel}</span>
          </div>

          <div className="relative z-20">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="lunar-button-ghost flex items-center gap-2"
            >
              <ArrowUpDown size={14} />
              {SORT_OPTIONS.find((o) => o.value === sortKey)?.label ?? "Sort"}
            </button>
            {showSortMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-[#0d1117] border border-white/10 rounded-xl z-20 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => { setSortKey(option.value); setPage(1); setShowSortMenu(false); }}
                    className={`w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                      sortKey === option.value
                        ? "bg-white/10 text-white"
                        : "text-white/60 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Groups List Display */}
        <div className="space-y-4 min-h-[400px]">
          {paginated.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
          {totalCount === 0 && (
            <div className="h-64 flex flex-col items-center justify-center opacity-40 italic">
              <p>No groups found. Try creating one!</p>
            </div>
          )}
        </div>

        {/* Standardized Pagination Footer */}
        <Pagination page={page} total={totalPages} onPageChange={setPage} />
      </div>

      {showCreate && (
        <CreateGroup
          onClose={() => setShowCreate(false)}
          onSuccess={() => router.refresh()}
        />
      )}
    </LunarThemeWrapper>
  );
}