"use client";

import { useEffect, useState } from "react";

/**
 * useAdminReports
 *
 * Custom hook for fetching and managing admin reports.
 * Handles:
 * - Fetching reports from backend API based on filters
 * - Managing loading state
 * - Storing pagination data (total pages + total results)
 * - Exposing a manual refetch function
 *
 * @param {Object} filters - Query parameters for filtering reports
 *
 * @returns {Object} Report data and control state
 */

export function useAdminReports(filters) {
    const [reports, setReports] = useState([]); //track if reports get rendered
    const [reportLoading, setReportLoading] = useState(true);		// Loading indicator for UI feedback
    const [totalReportPages, setTotalReportPages] = useState(1);	// Pagination metadata
    const [totalReports, setTotalReports] = useState(null);

    useEffect(() => {
        fetchReports();
    }, [filters]);

	/**
     * fetchReports
     *
     * Fetches report data from backend API using current filters.
     * Handles:
     * - Building query string
     * - API request
     * - Updating state with response data
     */
    async function fetchReports() {
        try {
            setReportLoading(true);		//start loading the state
            const query = new URLSearchParams(filters);		// Convert filters object to query string

            const res = await fetch(`/api/admin/reports?${query.toString()}`);

            if (!res.ok) {
                console.log("Failed to fetch reports");
                return;
            }

            const data = await res.json();

            setReports(data.reports);		// Update report data
            setTotalReportPages(data.totalPages);		// Update pagination info
            setTotalReports(data.totalMatchingReports);
        } 
        catch (err) {
            console.error(err);		// Handle network / unexpected errors
            setReportLoading(false);
        }
        finally {
            setReportLoading(false);		// Ensure loading state is always reset
        }
    }

    return {reports, totalReportPages, totalReports, reportLoading, fetchReports };
}