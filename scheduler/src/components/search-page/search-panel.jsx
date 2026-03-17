"use client";

import { useState } from "react";
import SearchControls from "@/components/search-page/search-controls";
import SearchUsers from "@/components/search-page/searchUsers";
import UserFilter from "@/components/admin/user-filter-panel";

import { useUsers } from "@/hooks/useUsers";

export default function SearchPanel({ open, onClose }) {
    const defaultUserFilters = { search:"", sortBy:"username", order:"desc", startDate:"", endDate:"", categories:[], page:1, limit:6 };

    const [currentTab,setCurrentTab] = useState("users");

    const [appliedUserFilters,setAppliedUserFilters] = useState(defaultUserFilters);
    const [draftUserFilters,setDraftUserFilters] = useState(defaultUserFilters);

    function resetUserFilters(){
        setDraftUserFilters(defaultUserFilters);
        setAppliedUserFilters(defaultUserFilters);
    }

    const [isUserFilterOpen,setIsUserFilterOpen] = useState(false);
    const {users,totalUserPages,totalUsers} = useUsers(appliedUserFilters,"/api/users/search");

    if (!open) return null;

    return (
    <>
      {/* backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/5 z-40"
      />

      {/* drawer */}
        <div className={`fixed top-0 left-0 h-screen w-[500px] bg-white border-r shadow-xl z-50 transform transition-transform duration-300 ease-out ${open ? "translate-x-0" : "-translate-x-full"}`}>
            {/* header */}
            <div className="p-5 border-b">
            <h2 className="text-xl font-semibold">Search</h2>
            </div>

            {/* search controls */}
            <div className="p-4 border-b">
                <SearchControls
                    filters={appliedUserFilters}
                    setFilters={setAppliedUserFilters}
                    placeholder="Search users..."
                    onOpenFilter={() => setIsUserFilterOpen(true)}
                    resetFilters={resetUserFilters}
                />
            </div>

            {/* content */}
            <div className="flex-1 overflow-y-auto p-4">

                {currentTab === "users" && (
                    <SearchUsers
                        users={users}
                        totalUsers={totalUsers}
                        totalUserPages={totalUserPages}
                        setIsUserFilterOpen={setIsUserFilterOpen}
                        filters={appliedUserFilters}
                        setFilters={setAppliedUserFilters}
                    />
                )}
            </div>
        </div>

      {/* filters */}
      {isUserFilterOpen && (
        <UserFilter
          filters={draftUserFilters}
          setFilters={setDraftUserFilters}
          onClose={() => setIsUserFilterOpen(false)}
          applyFilters={()=>{
            setAppliedUserFilters(prev => ({
                ...draftUserFilters,
                search: prev.search
            }))

            setIsUserFilterOpen(false)
           }}
        />
      )}
    </>
  );
}