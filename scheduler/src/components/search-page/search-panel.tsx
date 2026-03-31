"use client";

import { useState, useEffect } from "react";
import SearchControls from "@/components/search-page/search-controls";
import SearchUsers from "@/components/search-page/searchUsers";
import UserFilter from "@/components/admin/user-filter-panel";

import { useUsers } from "@/hooks/useUsers";

//UI components
import GlassCard from "@/components/ui/glassCard";
import LunarDrawer from "../layout/lunar-drawer";

/**
 * SearchPanel
 *
 * Main search interface rendered inside a drawer.
 * Handles:
 * - Managing user search filters (draft vs applied)
 * - Debounced search input updates
 * - Fetching users via useUsers hook
 * - Opening/closing filter panel
 * - Passing data to search result components
 *
 * @param {Object} props
 * @param {boolean} props.open - Controls visibility of the search panel
 * @param {Function} props.onClose - Closes the search panel
 *
 * @returns {JSX.Element} Search panel UI
 */
export default function SearchPanel({ open, onClose }) {
    const defaultUserFilters = { search:"", sortBy:"username", order:"desc", startDate:"", endDate:"", categories:[], page:1, limit:6 };

    const [currentTab,setCurrentTab] = useState("users");	// Currently selected tab 

    const [appliedUserFilters,setAppliedUserFilters] = useState(defaultUserFilters);
    const [draftUserFilters,setDraftUserFilters] = useState(defaultUserFilters);

	/**
     * resetUserFilters
     *
     * Resets both draft and applied filters to defaults
     */
    function resetUserFilters(){
        setDraftUserFilters(defaultUserFilters);
        setAppliedUserFilters(defaultUserFilters);
    }

    //debounce for the searching by 30 miliseconds instead of instantenous returning results
    useEffect(() => {
        const delay = setTimeout(() => {
            setAppliedUserFilters(prev => ({
                ...prev,
                search: draftUserFilters.search,
                page: 1
            }));
        }, 300);

        return () => clearTimeout(delay);
    }, [draftUserFilters.search]);

    const [isUserFilterOpen,setIsUserFilterOpen] = useState(false);
    const {users,totalUserPages,totalUsers} = useUsers(appliedUserFilters,"/api/users/search");

    return (
        <>
            {/* backdrop */}
            <LunarDrawer open={open} onClose={onClose} side="left" title="Search Panel" width="w-full sm:w-[420px]">
                {/* search controls */}
                <div className="p-4 flex-shrink-0">
                    <GlassCard className="p-3">
                        <SearchControls
                            filters={appliedUserFilters}
                            setFilters={setAppliedUserFilters}
                            placeholder="Search users..."
                            onOpenFilter={() => setIsUserFilterOpen(true)}
                            resetFilters={resetUserFilters}
                        />
                    </GlassCard>
                </div>

                {/* content */}
                <div className="flex flex-1 flex-col p-4 min-h-0">
                    <SearchUsers
                        users={users}
                        totalUsers={totalUsers}
                        totalUserPages={totalUserPages}
                        setIsUserFilterOpen={setIsUserFilterOpen}
                        filters={appliedUserFilters}
                        setFilters={setAppliedUserFilters}
                        selectedUser={null}                    
                        setSelectedUser={() => {}}
                        resetFilters={resetUserFilters}
                    />
                </div>
            </LunarDrawer>

            {/* filters */}
            <LunarDrawer
                open={isUserFilterOpen}
                onClose={() => setIsUserFilterOpen(false)}
                side="right"
                title="User Filters"
                width="400px"
            >
				<UserFilter
                    filters={draftUserFilters}
                    setFilters={setDraftUserFilters}
                    onClose={() => setIsUserFilterOpen(false)}
                    applyFilters={() => {
						setAppliedUserFilters(prev => ({
							...draftUserFilters,
							search: prev.search,
						}));
						setIsUserFilterOpen(false);
                    }}
					resetFilters={() => {
						setDraftUserFilters(defaultUserFilters);      
						setAppliedUserFilters(defaultUserFilters);
					}}
					type="admin" 
                />
            </LunarDrawer>
        </>
    );
}