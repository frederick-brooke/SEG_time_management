"use client";

import { useEffect, useState } from "react";

// fetches and manages task search results from the tasks API route
export function useTaskSearch(filters, endpoint) {

    const [tasks, setTasks] = useState([]);           // list of tasks returned from server
    const [totalTaskPages, setTotalTaskPages] = useState(1);
    const [totalTasks, setTotalTasks] = useState(0);  // total number of matching tasks
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTasks();
    }, [filters]);

    async function fetchTasks() {
        try {
            setLoading(true);

            const query = new URLSearchParams(filters);
            // convert filters object into query string

            const res = await fetch(`${endpoint}?${query.toString()}`);

            if (!res.ok) {
                const err = await res.json();
                console.log("API error:", err);
                return;
            }

            const data = await res.json();

            setTasks(data.tasks ?? []);
            setTotalTaskPages(data.totalTaskPages ?? 1);
            setTotalTasks(data.totalTasks ?? 0);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    return {
        tasks,
        totalTaskPages,
        totalTasks,
        loading,
        fetchTasks
    };
}