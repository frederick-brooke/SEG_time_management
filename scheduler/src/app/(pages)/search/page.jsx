"use client"
import { useState } from "react";
import SearchUsers from "@/components/search-page/searchUsers";
import { useUsers } from "@/hooks/useUsers";
import UserFilter from "@/components/admin/user-filter-panel";

export default function SearchPage() {
    //User management states
    const defaultUserFilters = { sortBy: "username", order: "desc", startDate: "", endDate: "", categories: [], page: 1};  //user search parameters

    const [appliedUserFilters, setAppliedUserFilters] = useState(defaultUserFilters);
    const [draftUserFilters, setDraftUserFilters] = useState(defaultUserFilters);
    
    function resetUserFilters(){
        setDraftUserFilters(defaultUserFilters);
        setAppliedUserFilters(defaultUserFilters);
    }

    const [selectedUser, setSelectedUser] = useState(null);   //user profile view
    const [isUserFilterOpen, setIsUserFilterOpen] = useState(false);  //search values to be checked and filtered for the usesrs

    const {users, totalUserPages, totalUsers, loading} = useUsers(appliedUserFilters, "/api/users/search");

    const [currentTab, setCurrentTab] = useState("users");  //display the current search being done

    //manage users, tasks, events search 
    //determine which filter panel and reset button to load up
    const [isSearchUsers, setIsSearchUsers] = useState(true);   //by default
    const [isSearchTasks, setIsSearchTasks] = useState(false);
    const [isSearchEvents, setIsSearchEvents] = useState(false);

    const tabs = {
        users: (
            <SearchUsers
                users={users}
                totalUsers={totalUsers}
                totalUserPages={totalUserPages}
                setIsUserFilterOpen={setIsUserFilterOpen}
                selectedUser={selectedUser}
                setSelectedUser={setSelectedUser}
                filters={appliedUserFilters}
                setFilters={setAppliedUserFilters}
                resetFilters={resetUserFilters}
            />
        ),
    
        tasks:(
            <p>Tasks</p>
        ),

        events:(
            <p>Events</p>
        ),
    }
    
    return(
        <>
            <div>
                {/* tabs header title */}
                <div className="flex border-b mb-4">
                    <button
                        onClick={() => setCurrentTab("users")}
                        className={`px-4 py-2 font-medium ${
                            currentTab === "users" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500"
                        }`}
                    >
                    Users
                    </button>

                    <button
                        onClick={() => setCurrentTab("tasks")}
                        className={`px-4 py-2 font-medium ${
                            currentTab === "tasks" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500"
                        }`}
                    >
                    Tasks
                    </button>
                </div>

                {/* render the active tab */}
                {tabs[currentTab]}
            </div>

            {isUserFilterOpen && (
                <UserFilter 
                filters={draftUserFilters}
                setFilters={setDraftUserFilters}
                onClose={() => setIsUserFilterOpen(false)}
                applyFilters={() => {
                    setAppliedUserFilters(draftUserFilters);
                    setIsUserFilterOpen(false);
                }}
                resetFilters={() => {
                    setAppliedUserFilters(defaultUserFilters);
                }}              
                />
            )}        
        </>       
    );
}