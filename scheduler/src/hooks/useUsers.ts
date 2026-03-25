"use client";
//reusable component for user searching
import { useEffect, useState } from "react";

type Filters = Record<string, string | number | string[] | null | undefined>; //Generic filter type for query params

/**
 * Custom hook for fetching and managing user data.
 * Handles:
 * - Building query params from flexible filter object
 * - Fetching users from a provided API endpoint
 * - Managing loading state
 * - Returning pagination metadata
 *
 * @param {Filters} filters - Filter object for query params
 * @param {string} endpoint - API endpoint to fetch users from
 *
 * @returns {Object} Users data and control state
 */
export function useUsers(filters: Filters, endpoint: string) {
    const [users, setUsers] = useState([]);     //list of all the user objects from server
    const [totalUserPages, setTotalUserPages] = useState(1);   
    const [totalUsers, setTotalUsers] = useState(0);    //total number of users for pagination
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();   //reapply fetch for every change
    }, [filters]);

	/**
    * Fetches users from API using dynamic filters.
    * Handles:
    * - Converting filters → query string
    * - Supporting array values (e.g. multiple categories)
    * - Updating state with response
    */
    async function fetchUsers() {
        try {
            setLoading(true);

            const query = new URLSearchParams();

            Object.entries(filters).forEach(([key, value]) => {
				if (Array.isArray(value)) {
					value.forEach(v => query.append(key, String(v)));
				} else if (value !== "" && value != null) {
					query.append(key, String(value));
				}
			});
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

    return {users, totalUserPages, totalUsers, fetchUsers,loading, };
}