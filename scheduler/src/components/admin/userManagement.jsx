import { useState } from "react";
import UserPanel from "@/components/admin/admin-user-panel";
import {FunnelXIcon } from "lucide-react";

export default function UserManagement({users,totalUsers, totalUserPages, setIsUserFilterOpen, selectedUser, setSelectedUser, filters, setFilters, resetFilters})
{
    const [inputValue, setInputValue] = useState(filters.search ?? "");   // typed value

    const start = (filters.page - 1) * filters.limit + 1;
    const end = Math.min(filters.page * filters.limit, totalUsers);

    console.log("Users received:", users);
    console.log("Total users:", totalUsers);

    return(
        <div>
            <section className="mb-4 bg-white shadow rounded p-6 flex flex-col h-[660px]">
                <h2 className="text-2xl font-semibold mb-4">User Management</h2>
                
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
                        className="border rounded px-3 py-2 max-w-sm"
                    />

                    <button
                        type="submit"
                        className="ml-2 bg-blue-500 text-white px-4 py-2 rounded"
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
                        className="ml-2 bg-blue-500 text-white px-4 py-2 rounded"
                        onClick={() => {setInputValue(""); resetFilters()}}
                    >
                        <FunnelXIcon size={18}/>
                    </button>
                </form>
                
                <div className="space-y-2 flex-1 overflow-y-auto min-h-0 mt-4">
                    {users.map((user) => (
                        <div key={user.id} 
                            onClick={() => setSelectedUser(user)}
                            className={`border-b py-1 cursor-pointer transition ${user.isBanned ? "bg-red-100 text-red-700" : "hover:bg-gray-100"}`}>
                            {user.username}
                        </div>
                    ))}
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
                    <div className="flex items-center justify-between mt-4 border-t pt-4 flex-shrink-0">
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