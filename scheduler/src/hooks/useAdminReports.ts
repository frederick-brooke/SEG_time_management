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
export function useAdminReports(filters: Record<string, string>) {
  const [reports, setReports] = useState([]);
  const [reportLoading, setReportLoading] = useState(true);
  const [totalReportPages, setTotalReportPages] = useState(1);
  const [totalReports, setTotalReports] = useState<number | null>(null);

  useEffect(() => {
    fetchReports();
  }, [JSON.stringify(filters)]);


  async function fetchReports() {
    try {
      setReportLoading(true);
      const query = new URLSearchParams(filters);
      const res = await fetch(`/api/admin/reports?${query.toString()}`);

      if (!res.ok) {
        console.log("Failed to fetch reports");
        return;
      }

      const data = await res.json();
      setReports(data.reports);
      setTotalReportPages(data.totalPages);
      setTotalReports(data.totalMatchingReports);
    } catch (err) {
      console.error(err);
    } finally {
      setReportLoading(false);
    }
  }

  return { reports, totalReportPages, totalReports, reportLoading, fetchReports };
}