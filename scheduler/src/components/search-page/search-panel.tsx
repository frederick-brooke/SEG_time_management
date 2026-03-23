"use client";

import { useState, useEffect } from "react";
import SearchControls from "@/components/search-page/search-controls";
import SearchUsers from "@/components/search-page/searchUsers";
import UserFilter from "@/components/admin/user-filter-panel";

import { useUsers } from "@/src/hooks/useUsers";

//UI components
import GlassCard from "@/components/ui/glassCard";
import LunarDrawer from "../layout/lunar-drawer";

export default function SearchPanel({ open, onClose }) {
    const defaultUserFilters = { search:"", sortBy:"username", order:"desc", startDate:"", endDate:"", categories:[], page:1, limit:6 };

    const [currentTab,setCurrentTab] = useState("users");

    const [appliedUserFilters,setAppliedUserFilters] = useState(defaultUserFilters);
    const [draftUserFilters,setDraftUserFilters] = useState(defaultUserFilters);

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
            <LunarDrawer open={open} onClose={onClose} side="left" title="Search Panel">
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
                />
            </LunarDrawer>
        </>
    );
}