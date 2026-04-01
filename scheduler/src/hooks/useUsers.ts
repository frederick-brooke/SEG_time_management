"use client";
//reusable component for user searching
import { useEffect, useState, useCallback } from "react";

type Filters = Record<string, string | number | string[] | null | undefined>; //Generic filter type for query params

/**
 * Custom hook for fetching and managing user data.
 * Handles:
 * - Building query params from flexible filter object
 * - Fetching users from a provided API endpoint
 * - Managing loading state
 * - Returning pagination metadata
 * @param {Filters} filters - Filter object for query params
 * @param {string} endpoint - API endpoint to fetch users from
 * @returns {Object} Users data and control state
 */
export function useUsers(filters: Filters, endpoint: string) {
    const [users, setUsers] = useState<any[]>([]);
    const [totalUserPages, setTotalUserPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const [loading, setLoading] = useState(true);
    //Executes fetch and updates state.
    const fetchUsers = useCallback(async () => {
        setLoading(true);

        try {
            const query = buildQuery(filters);
            const data = await request(`${endpoint}?${query}`);

            setUsers(data.users ?? []);
            setTotalUserPages(data.totalUserPages ?? 1);
            setTotalUsers(data.totalUsers ?? 0);
        } catch (err) {
            console.error(err);
            setUsers([]);
            setTotalUserPages(1);
            setTotalUsers(0);
        } finally {
            setLoading(false);
        }
    }, [filters, endpoint]);

    //Fetch on dependency change.
    useEffect(() => {  fetchUsers(); }, [fetchUsers]);

    return { users, totalUserPages, totalUsers, loading, refetch: fetchUsers, };
}

/**
 * Builds a query string from filters.
 *
 * @param {Filters} filters
 * @returns {string}
 */
function buildQuery(filters: Filters): string {
    const query = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
        if (value == null || value === "") return;

        if (Array.isArray(value)) {
            value.forEach(v => query.append(key, String(v)));
            return;
        }

        query.append(key, String(value));
    });

    return query.toString();
}

/**
 * Fetches user data from API.
 *
 * @param {string} url
 * @returns {Promise<any>}
 */
async function request(url: string) {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch users");
    return res.json();
}