import { useState } from "react";
import UserPanel from "@/components/admin/admin-user-panel";
import {FunnelXIcon } from "lucide-react";

export default function UserManagement({users,totalUsers, totalUserPages, setIsUserFilterOpen, selectedUser, setSelectedUser, filters, setFilters, resetFilters})
{
    const [inputValue, setInputValue] = useState(filters.search ?? "");   // typed value

    const start = (filters.page - 1) * filters.limit + 1;
    const end = Math.min(filters.page * filters.limit, totalUsers);

    console.log({
        page: filters.page,
        limit: filters.limit,
        skip: (filters.page - 1) * filters.limit
    });

    return(
        <div>
            <section className="mb-4 flex flex-col h-[660px]">
                <h2 className="text-xl font-semibold mb-4 text-white">User Management</h2>
                
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        setFilters(saved_result => ({
                            ...saved_result,
                            search: inputValue,
                            page: 1,
                        }));
                    }}
                    className="flex items-center gap-2"
                >
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={inputValue}
                        onChange={(e) => {
                            const value = e.target.value;
                            setInputValue(value);

                            setFilters(prev => ({
                                ...prev,
                                search: value,
                                page: 1,
                            }));
                        }}
                        className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-blue-300/50 w-full max-w-sm"
                    />

                    <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-blue-300 text-gray-950 font-medium hover:scale-105 transition"
                    >
                        Search
                    </button>

                    <button
                        type="button"
                        className="px-4 py-2 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 transition"
                        onClick={() => setIsUserFilterOpen(true)}
                    >
                        Filter
                    </button>

                    <button 
                        type="button" 
                        className="p-2 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 transition"
                        onClick={() => {setInputValue(""); resetFilters()}}
                    >
                        <FunnelXIcon size={18}/>
                    </button>
                </form>
                
                <div className="space-y-2 flex-1 overflow-y-auto min-h-0 mt-4 pr-1">
                    {users.map((user) => (
                        <div key={user.id} 
                            onClick={() => setSelectedUser(user)}
                            className={`px-3 py-2 rounded-lg cursor-pointer transition-all ${user.isBanned ? "bg-red-100/10 text-red-300" : "text-white hover:bg-white/20"}`}>
                            {user.username}
                        </div>
                    ))}
                </div>

                <div className="mt-4 flex justify-center flex-shrink-0">
                    {users.length !== 0 ? (
                        <p className="text-sm text-white/60">
                            Showing{" "}
                            <span className="font-semibold text-white">
                                {start}-{end}
                            </span>{" "}
                            of{" "}
                            <span className="font-semibold text-white">
                                {totalUsers}
                            </span>{" "}
                            users
                        </p>
                    ) : (
                        <p className="text-sm text-white/40 mt-4">
                        No users found.
                        </p>
                    )}
                </div>

                {totalUserPages >= 1 && (
                    <div className="flex items-center justify-between mt-4 border-t pt-4 border-white/10 flex-shrink-0">
                        <button
                            disabled={filters.page === 1}

                            onClick={() =>
                                setFilters(prev => ({
                                    ...prev,
                                    page: prev.page - 1,
                                }))
                            }
                            className="px-3 py-1 border rounded-lg bg-white/5 text-white/70 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>

                        <span className="text-sm text-white-600">
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
                            className="px-3 py-1 border rounded-lg bg-white/5 text-white/70 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
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