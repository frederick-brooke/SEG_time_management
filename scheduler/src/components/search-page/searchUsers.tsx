"use client";

import { useState, useEffect } from "react";
import UserPanel from "@/components/admin/admin-user-panel";
import UserCard from "./user-cards";
import { addRecentUser, getRecentUsers, removeRecentUser, clearRecentUsers } from "@/lib/recent-users";
import { IconX } from "@tabler/icons-react";

//UI components
import GlassCard from "@/components/ui/glassCard";

export default function SearchUsers({users,totalUsers, totalUserPages, setIsUserFilterOpen, selectedUser, setSelectedUser, filters, setFilters, resetFilters})
{    
    const start = (filters.page - 1) * filters.limit + 1;
    const end = Math.min(filters.page * filters.limit, totalUsers);

    const [recentUsers, setRecentUsers] = useState([]);

    useEffect(() => {
        if (filters.search === "") {
            setRecentUsers(getRecentUsers());
        }
    }, [filters.search]);

    return(
        <div className="p-6 flex flex-col gap-4">
                {filters.search === "" && recentUsers.length > 0 && (
                    <GlassCard className="p-4">
                        {/* Header for recent users and clear button */}
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-sm font-semibold text-white/70">Recent Searches</p>

                            {/* Clear all recent users from local storage */}
                            <button
                                onClick={() => {
                                    clearRecentUsers();          // remove all stored recents
                                    setRecentUsers([]);          // update state so UI refreshes
                                }}
                                className="text-sm text-red-400 hover:text-red-500 transition"
                            >
                                Clear All
                            </button>
                        </div>

                        {/* If no recent users exist show empty message */}
                        <div className="flex flex-col gap-2">
                            {recentUsers.map((user) => (
                                <div key={user.username} className="flex items-center justify-between">
                                    <UserCard
                                        user={user}
                                        onClick={() => {
                                            addRecentUser(user);
                                            window.location.href = `/profile/${user.username}`;
                                        }}
                                    />
                                    <button
                                        onClick={() => {
                                            removeRecentUser(user.username);
                                            setRecentUsers(getRecentUsers());
                                        }}
                                        className="text-gray-400 hover:text-red-500 transition"
                                    >
                                        <IconX size={16}/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                )}

                {/* If searching or no recent users */}
                {filters.search !== "" && users.length === 0 && (
                    <p className="text-gray-400 text-center mt-6">No users found</p>
                )}
                
                {users.length > 0 && (
                <GlassCard className="p-4 flex flex-col gap-4 overflow-hidden bg-gradient-to-b from-[#0a0a1a] via-[#1a1a3f] to-[#05051a] border-blue-300/30">
                    <div className="flex flex-col gap-2 overflow-y-auto max-h-[500px]">
                        {users.map((user) => (
                            <UserCard
                                key={user.id}
                                user={user}
                                onClick={() => {
                                    addRecentUser(user);
                                    window.location.href = `/profile/${user.username}`;
                                }}
                            />
                        ))}
                    </div>

                    {/* Pagination */}
                    <div className="mt-4 flex justify-between items-center text-white/70 text-sm">
                        <button
                            disabled={filters.page === 1}
                            onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                            className="px-3 py-1 rounded-md border border-white/20 hover:bg-white/10 disabled:opacity-40"
                        >
                            Previous
                        </button>

                        <span>
                            Showing {start}-{end} of {totalUsers} users
                        </span>

                        <button
                            disabled={filters.page === totalUserPages}
                            onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                            className="px-3 py-1 rounded-md border border-white/20 hover:bg-white/10 disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                </GlassCard>
            )}      

            <UserPanel user={selectedUser} onClose={() => setSelectedUser(null)}/>
        </div>
    )
}