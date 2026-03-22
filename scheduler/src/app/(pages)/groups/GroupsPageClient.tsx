'use client';

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { GroupCard } from "@/components/groups/GroupCard";
import CreateGroup from "@/components/groups/CreateGroup";
import { Plus, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import LunarThemeWrapper from "@/components/layout/LunarThemeWrapper";

//section types
interface GroupItem {
  id: string;
  name: string;
  description?: string | null;
  memberCount: number;
  userRole: string;
  createdAt: Date;
  creator: {
    username: string;
    fname?: string | null;
    lname?: string | null;
  };
}

interface GroupsPageClientProps {
  groups: GroupItem[];
}

type SortKey = "newest" | "oldest" | "name-asc" | "name-desc" | "members-desc" | "members-asc";

//section constants
const PAGE_SIZE = 10;

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest",       label: "Newest first"   },
  { value: "oldest",       label: "Oldest first"   },
  { value: "name-asc",     label: "Name A → Z"     },
  { value: "name-desc",    label: "Name Z → A"     },
  { value: "members-desc", label: "Most members"   },
  { value: "members-asc",  label: "Fewest members" },
];

//section helpers

/**
 * Sorts a list of groups by the given sort key
 * @param {GroupItem[]} groups - Unsorted group list
 * @param {SortKey} key - Sort criteria
 * @return {GroupItem[]} - Sorted copy of the group list
 */
function sortGroups(groups: GroupItem[], key: SortKey): GroupItem[] {
  const copy = [...groups];
  switch (key) {
    case "name-asc":     return copy.sort((a, b) => a.name.localeCompare(b.name));
    case "name-desc":    return copy.sort((a, b) => b.name.localeCompare(a.name));
    case "members-desc": return copy.sort((a, b) => b.memberCount - a.memberCount);
    case "members-asc":  return copy.sort((a, b) => a.memberCount - b.memberCount);
    case "newest":       return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    case "oldest":       return copy.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    default:             return copy;
  }
}

//section component

/**
 * Client component for the groups list page with sorting, pagination, and create modal
 * @param {GroupsPageClientProps} props - Initial groups data from server
 * @return {JSX.Element} - Groups page with controls and modal
 */
export default function GroupsPageClient({ groups: initialGroups }: GroupsPageClientProps) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [page, setPage] = useState(1);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const sorted = useMemo(() => sortGroups(initialGroups, sortKey), [initialGroups, sortKey]);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageStart = (page - 1) * PAGE_SIZE;
  const paginated = sorted.slice(pageStart, pageStart + PAGE_SIZE);
  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sortKey)?.label ?? "Sort";

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
    <LunarThemeWrapper>
      <div className="lunar-page">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="lunar-page-title">My Groups</h1>
            <p className="lunar-page-subtitle">
              Create groups with your friends to share tasks and events
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="lunar-button-primary !text-white !bg-white/10 !border-white/20 hover:!bg-white/20 flex items-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
          >
            <Plus size={18} />
            <span>Create Group</span>
          </button>
        </div>

        {initialGroups.length > 0 ? (
          <>
            {/* Controls row */}
            <div className="flex items-center justify-between mb-6">
              <p className="lunar-value font-medium">
                {sorted.length} group{sorted.length !== 1 ? "s" : ""}
              </p>

              {/* Sort dropdown */}
              <div className="relative z-20">
                <button
                  onClick={() => setShowSortMenu((v) => !v)}
                  className="lunar-button-ghost flex items-center gap-2"
                >
                  <ArrowUpDown size={14} />
                  {currentSortLabel}
                </button>
                {showSortMenu && (
                  <div className="absolute right-0 mt-2 w-48 lunar-select-content py-1">
                    {SORT_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleSort(option.value)}
                        className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                          sortKey === option.value
                            ? "bg-white/10 text-white font-bold"
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

            {/* Groups list */}
            <div className="space-y-4">
              {paginated.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                  className="lunar-button-ghost px-3 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
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
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page === totalPages}
                  className="lunar-button-ghost px-3 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        ) : (
          
          /* Empty State */
          <div className="lunar-card border border-white/10 p-16 flex flex-col items-center justify-center text-center mt-8">
            <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <span className="text-4xl drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">👥</span>
            </div>
            <h3 className="lunar-header text-xl mb-2 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">No groups yet</h3>
            <p className="lunar-value text-sm">Create a group and add your friends to collaborate</p>
          </div>
        )}

      </div>

      {/* Create modal */}
      {showCreate && (
        <CreateGroup
          onClose={() => setShowCreate(false)}
          onSuccess={() => router.refresh()}
        />
      )}
    </LunarThemeWrapper>
  );
}