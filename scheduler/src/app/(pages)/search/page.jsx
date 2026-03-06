"use client"
import { useEffect, useState } from "react";
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
    

    return(
        <>
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