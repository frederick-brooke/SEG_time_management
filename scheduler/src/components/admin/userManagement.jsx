import { useState } from "react";
import UserPanel from "@/components/admin-user-panel";
import UserFilter from "@/components/user-filter-panel";

export default function UserManagement({users,totalUsers, totalUserPages, searchQuery, setSearchQuery, currentUserPage, setCurrentUserPage,
  setIsUserFilterOpen, selectedUser, setSelectedUser})
{
    const [inputValue, setInputValue] = useState(searchQuery ?? "");   // typed value

    return(
        <div>
            <section className="mb-4 bg-white shadow rounded p-6">
                <h2 className="text-2xl font-semibold mb-4">User Management</h2>
                
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        setSearchQuery(inputValue); 
                        setCurrentUserPage(1);
                    }}
                    className="flex items-center gap-2"
                >
                <input
                    type="text"
                    placeholder="Search users..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
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
                </form>
                
                <div className="space-y-2 flex-1 overflow-y-auto">
                {users.map((user) => (
                    <div key={user.id} 
                    onClick={() => setSelectedUser(user)}
                    className="border-b py-1 cursor-pointer">
                        {user.username}
                    </div>
                    ))}
                </div>

                <div className="mt-4 flex justify-center">
                {users.length !== 0 && (
                    <p className="text-sm text-gray-600">
                    Showing{" "}
                    <span className="font-semibold text-gray-900">
                    {users.length}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-gray-900">
                        {totalUsers}    
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
                        disabled={currentUserPage === 1}
                        onClick={() => setCurrentUserPage((prev) => prev - 1)}
                        className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                        Previous
                        </button>

                        <span className="text-sm text-gray-600">
                            Page {currentUserPage} of {totalUserPages}
                        </span>

                        <button
                            disabled={currentUserPage === totalUserPages}
                            onClick={() => setCurrentUserPage((prev) => prev + 1)}
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