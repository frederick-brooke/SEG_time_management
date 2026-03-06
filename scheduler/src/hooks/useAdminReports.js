"use client";

import { report } from "node:process";
import { useEffect, useState } from "react";

export function useAdminReports(filters) {
    const [reports, setReports] = useState([]); //track if reports get rendered
    const [reportLoading, setReportLoading] = useState(true);
    const [totalReportPages, setTotalReportPages] = useState(1);
    const [totalReports, setTotalReports] = useState(null);

    useEffect(() => {
        fetchReports();
    }, [filters]);

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
        } 
        catch (err) {
            console.error(err);
            setReportLoading(false);
        }
        finally {
            setReportLoading(false);
        }
    }

    return {reports, totalReportPages, totalReports, reportLoading, fetchReports };
}