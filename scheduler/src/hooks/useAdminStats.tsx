import { useState, useEffect } from "react"

/**
 * Handles:
 * - Fetching aggregated stats from backend API
 * - Storing stats in local state
 * - Providing data for dashboards or overview panels
 *
 * @returns {Object} stats - Object containing totals (users, reports, appeals)
 */
export function useAdminStats() {
  const [stats, setStats] = useState({ totalUsers: 0, totalReports: 0, totalAppeals: 0 });

  useEffect(() => {		
    fetch("/api/admin/stats")
      .then(res => res.json())
      .then(data => setStats(data));	
  }, []);

  return stats;
}