"use client";

import { useState, useEffect } from "react";
import SearchControls from "@/components/search-page/search-controls";
import SearchUsers from "@/components/search-page/searchUsers";
import UserFilter from "@/components/admin/user-filter-panel";

import { useUsers } from "@/hooks/useUsers";

//UI components
import GlassCard from "@/components/ui/glassCard";

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

    if (!open) return null;

    return (
    <>
        {/* backdrop */}
        <div onClick={onClose} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"/>

            {/* drawer */}
            <div className={`fixed top-0 left-0 h-screen w-[500px] flex flex-col bg-gradient-to-b from-gray-900 via-indigo-900 to-blue-900 border-r shadow-2xl z-50 transform transition-transform duration-300 ease-out ${open ? "translate-x-0" : "-translate-x-full"}`}>
                {/* header */}
                <div className="p-5 border-b border-white/10 flex-shrink-0">
                    <h2 className="text-2xl font-semibold text-white tracking-wide">Search Panel</h2>
                </div>

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
            </div>

            {/* filters */}
            {isUserFilterOpen && (
                <GlassCard className="fixed top-16 left-[520px] w-[360px] p-4 z-50">
                    <UserFilter
                        filters={draftUserFilters}
                        setFilters={setDraftUserFilters}
                        onClose={() => setIsUserFilterOpen(false)}
                        applyFilters={()=>{
                            setAppliedUserFilters(prev => ({
                                ...draftUserFilters,
                                search: prev.search
                            }));
                            setIsUserFilterOpen(false);
                        }}
                    />
                </GlassCard>
            )}
        </>
    );
}