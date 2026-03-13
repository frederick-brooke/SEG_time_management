import { useState, useEffect } from "react"

export function useAdminStats() {
  const [stats, setStats] = useState({ totalUsers: 0, totalReports: 0, totalAppeals: 0 });

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(res => res.json())
      .then(data => setStats(data));
  }, []);

  return stats;
}