"use client";

import { useEffect, useState } from "react";

export function useAdminStats(filters) {
    const [users, setUsers] = useState([]);
    const [totalUserPages, setTotalUserPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, [filters]);

    async function fetchUsers() {
        try {
            setLoading(true);

            const query = new URLSearchParams(filters);
            const res = await fetch(`/api/admin/users?${query.toString()}`);

            if (!res.ok) {
                const err = await res.json();
                console.log("API error:", err);
                return;
            }

            const data = await res.json();

            // IMPORTANT: match your API shape here
            setUsers(data.users ?? []);
            setTotalUserPages(data.totalUserPages ?? 1);
            setTotalUsers(data.totalUsers ?? 0);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
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