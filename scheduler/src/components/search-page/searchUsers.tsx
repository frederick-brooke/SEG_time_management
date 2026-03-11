"use client";

import { useState, useEffect } from "react";
import UserPanel from "@/components/admin/admin-user-panel";
import UserCard from "./user-cards";
import { addRecentUser, getRecentUsers, removeRecentUser, clearRecentUsers } from "@/lib/recent-users";

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
        <div className="p-6">
            <section className="bg-white shadow rounded p-4 flex flex-col h-full">

                {/* 
                If the search box is empty we show RECENT USERS instead of the search message.
                This replaces the previous "Start typing..." message.
                */}
                {filters.search === "" ? (
                    <>
                        {/* Header for recent users + clear button */}
                        <div className="flex justify-between items-center mb-3">
                            <p className="text-sm font-semibold">Recent</p>

                            {/* Clear all recent users from local storage */}
                            <button
                                onClick={() => {
                                    clearRecentUsers();          // remove all stored recents
                                    setRecentUsers([]);          // update state so UI refreshes
                                }}
                                className="text-sm text-red-500"
                            >
                                Clear All
                            </button>
                        </div>
                        {/* If no recent users exist show empty message */}
                        {recentUsers.length === 0 ? (
                            <p className="text-gray-500 text-center mt-6">
                                No recent searches
                            </p>
                        ) : (
                            <div className="flex flex-col">
                                {/* Display stored recent users */}
                                {recentUsers.map((user) => (
                                    <div
                                        key={user.username}
                                        className="flex items-center justify-between"
                                    >
                                        {/* Clicking a recent user navigates to their profile */}
                                        <UserCard
                                            user={user}
                                            onClick={() => {
                                                addRecentUser(user); // refresh recent position
                                                window.location.href = `/profile/${user.username}`;
                                            }}
                                        />

                                        {/* Remove a single recent search */}
                                        <button
                                            onClick={() => {
                                                removeRecentUser(user.username);       // remove from storage
                                                setRecentUsers(getRecentUsers());      // refresh UI
                                            }}
                                            className="text-gray-400 hover:text-red-500 ml-2"
                                        >
                                            ✕
                                        </button>

                                    </div>
                                ))}

                            </div>
                        )}
                    </>
                ) : users.length === 0 ? (
                    <p className="text-gray-500 text-center mt-6">
                        {/* If searching but no results */}
                        No users found
                    </p>
                ) : (
                    <>
                        <div className="user-list">

                            {/* Map through users and display them */}
                            <div className="flex-1 overflow-y-auto">
                                <div className="flex flex-col">

                                    {users.map((user) => (

                                        <UserCard
                                            key={user.id}
                                            user={user}

                                            onClick={() => {
                                                addRecentUser(user); // store clicked user as recent
                                                window.location.href = `/profile/${user.username}`;
                                            }}
                                        />

                                    ))}

                                </div>
                            </div>

                        </div>

                        {/* Pagination information */}
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

                        {/* Pagination controls */}
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