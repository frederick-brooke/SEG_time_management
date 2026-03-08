"use client";

import { useEffect, useState } from "react";

//fetches and manages user statistics from the admin API route
export function useUsers(filters, endpoint) {
    const [users, setUsers] = useState([]);     //list of all the user objects from server
    const [totalUserPages, setTotalUserPages] = useState(1);   
    const [totalUsers, setTotalUsers] = useState(0);    //total number of users for pagination
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();   //reapply fetch for every change
    }, [filters]);

    async function fetchUsers() {
        try {
            setLoading(true);

            const params = new URLSearchParams({
                sortBy: filters.sortBy ?? "createdAt",
                order: filters.order ?? "desc",
                page: filters.page ?? 1,
                limit: 10,
                startDate: filters.startDate ?? "",
                endDate: filters.endDate ?? "",
            });

            if (filters.categories && filters.categories.length > 0) {
                params.append("categories", filters.categories.join(","));
            }

            const res = await fetch(`${endpoint}?${params.toString()}`);

            if (!res.ok) {
                const err = await res.json();
                console.log("API error:", err);
                return;
            }

            const data = await res.json();  //returned response from the query which updates the state variables

            setUsers(data.users ?? []);
            setTotalUserPages(data.totalUserPages ?? 1);
            setTotalUsers(data.totalUsers ?? 0);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);  //display loading text during the fetch sequence
        }
    }

    return {
        users,
        totalUserPages,
        totalUsers,
        loading,
        fetchUsers
    };
}