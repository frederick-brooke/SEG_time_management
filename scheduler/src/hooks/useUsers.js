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

            const query = new URLSearchParams(filters);
            //filter objects parsed by user is converted into query string
            const res = await fetch(`${endpoint}?${query.toString()}`);

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