"use client";
import { useEffect, useState } from "react";

/**
 * useAdminAppeals
 *
 * Custom hook for fetching and managing admin appeals.
 * Handles:
 * - Fetching appeals from backend API based on filters
 * - Managing loading state
 * - Storing pagination data (total pages + total results)
 * - Exposing a manual refetch function
 *
 * @param {Object} filters - Query parameters for filtering appeals
 *
 * @returns {Object} Appeal data and control state
 */
export function useAdminAppeals(filters) {
	const [appeals, setAppeals] = useState([]);		//appeal data state
	const [appealLoading, setAppealLoading] = useState(true);		//loading indicator for UI feedback
	const [totalAppealPages, setTotalAppealPages] = useState(1);	// Pagination metadata
	const [totalAppeals, setTotalAppeals] = useState(null);

	useEffect(() => {
		fetchAppeals();
	}, [filters]);

	/*
	* fetchAppeals fetches appeal data from backend API using current filters.
	* Handles building query string, API request and updating state with response data
	*/
	async function fetchAppeals() {
		try {
			setAppealLoading(true);
			const query = new URLSearchParams(filters);

			const res = await fetch(
				`/api/admin/appeals?${query.toString()}`
			);

			if (!res.ok) {
				console.log("Failed to fetch appeals");
				return;
			}

			const data = await res.json();

			setAppeals(data.appeals);
			setTotalAppealPages(data.totalAppealPages);
			setTotalAppeals(data.totalAppeals);
		} catch (err) {
			console.error(err);
		} finally {
			setAppealLoading(false);
		}
	}
	return {appeals, totalAppealPages, totalAppeals,  appealLoading, fetchAppeals,};
}