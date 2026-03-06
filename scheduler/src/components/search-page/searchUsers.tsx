"use client";

import { useState } from "react";
import UserPanel from "@/components/admin/admin-user-panel";
import {FunnelXIcon } from "lucide-react";
import { useRouter } from "next/router";
import UserCard from "./user-cards";

export default function SearchUsers({users,totalUsers, totalUserPages, setIsUserFilterOpen, selectedUser, setSelectedUser, filters, setFilters, resetFilters})
{
    const [inputValue, setInputValue] = useState(filters.search ?? "");   // typed value
    const [limit] = useState(10);   //from the API 

    return(
        <div className="p-6">
            <section className="mb-4 bg-white shadow rounded p-6">
                <h2 className="text-2xl font-semibold mb-4">Search</h2>
                
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        setFilters(saved_result => ({
                            ...saved_result,
                            search: inputValue,
                            page: 1,
                        }));
                    }}
                    className="flex flex wrap items-center gap-2 mb-6"
                >
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="border rounded px-3 py-2 flex-1 min-w-[200px]"
                    />

                    <button
                        type="submit"
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                    >
                        Search
                    </button>

                    <button
                        type="button"
                        className="ml-2 bg-blue-500 text-white px-4 py-2 rounded"
                        onClick={() => setIsUserFilterOpen(true)}
                    >
                        Filter
                    </button>

                    <button 
                        type="button" 
                        className="bg-gray-200 text-gray-700 px-3 py-2 rounded hover:bg-gray-300 transition flex items-center"
                        onClick={() => {setInputValue(""); resetFilters()}}
                    >
                        <FunnelXIcon size={16} className="mr-1"/> Reset
                    </button>
                </form>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {users.map((user) => (
                        <UserCard key={user.id} user={user} onClick={() => window.location.href = `/profile/${user.username}`} />// navigate to profile
                    ))}
                </div>

                <div className="mt-4 flex justify-center">
                    {users.length !== 0 && (
                        <p className="text-sm text-gray-600">
                            Showing{" "}
                        <span className="font-semibold text-gray-900">
                            {(filters.page - 1) * limit + 1}
                        </span>{" "}
                        to{" "}
                        <span className="font-semibold text-gray-900">
                            {(filters.page - 1) * limit + users.length}   
                        </span>{" "}
                            users
                        </p>
                    )}           

                    {users.length === 0 && (
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

                <UserPanel user={selectedUser} onClose={() => setSelectedUser(null)}/>
            </section>
        </div>
    )
}