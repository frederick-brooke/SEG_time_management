"use client";

import { useState } from "react";
import UserPanel from "@/components/admin/admin-user-panel";
import UserCard from "./user-cards";

export default function SearchUsers({users,totalUsers, totalUserPages, setIsUserFilterOpen, selectedUser, setSelectedUser, filters, setFilters, resetFilters})
{    
    const start = (filters.page - 1) * filters.limit + 1;
    const end = Math.min(filters.page * filters.limit, totalUsers);

    return(
        <div className="p-6">
            <section className="bg-white shadow rounded p-4 flex flex-col h-full">

                {filters.search === "" ? (
                    <p className="text-gray-500 text-center mt-6">
                        Start typing to search for users
                    </p>
                ) : users.length === 0 ? (
                    <p className="text-gray-500 text-center mt-6">
                        No users found
                    </p>
                ) : (
                    <>
                        {/* Add your actual user list rendering here */}
                        
                        <div className="user-list">
                            {/* Map through users and display them */}
                            <div className="flex-1 overflow-y-auto">
                                <div className="flex flex-col">
                                    {users.map((user) => (
                                        <UserCard key={user.id} user={user} onClick={() => window.location.href = `/profile/${user.username}`} />// navigate to profile
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-4 flex justify-center flex-shrink-0">
                            {users.length !== 0 ? (
                                <p className="text-sm text-gray-600">
                                Showing{" "}
                                <span className="font-semibold text-gray-900">
                                    {start}-{end}
                                </span>{" "}
                                of{" "}
                                <span className="font-semibold text-gray-900">
                                    {totalUsers}
                                </span>{" "}
                                users
                                </p>
                            ) : (
                                <p className="text-sm text-gray-500 mt-4">
                                No users found.
                                </p>
                            )}
                        </div>

                        {totalUserPages >= 1 && (
                            <div className="flex items-center justify-between mt-4 border-t flex-shrink-0">
                                <button
                                disabled={filters.page === 1}
                                onClick={() =>
                                    setFilters(prev => ({
                                        ...prev,
                                        page: prev.page - 1,
                                    }))
                                }
                                className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>

                                <span className="text-sm text-gray-600">
                                    Page {filters.page} of {totalUserPages}
                                </span>

                                <button
                                    disabled={filters.page === totalUserPages}
                                    onClick={() => 
                                        setFilters(prev => ({
                                            ...prev,
                                            page: prev.page + 1
                                        }))
                                    }
                                    className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                Next
                                </button>
                            </div>
                        )}
                    </>
                )}                  

                <UserPanel user={selectedUser} onClose={() => setSelectedUser(null)}/>
            </section>
        </div>
    )
}