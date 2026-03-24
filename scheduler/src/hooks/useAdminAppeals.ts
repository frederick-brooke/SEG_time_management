"use client";

import { useEffect, useState } from "react";

export function useAdminAppeals(filters) {
  const [appeals, setAppeals] = useState([]);
  const [appealLoading, setAppealLoading] = useState(true);
  const [totalAppealPages, setTotalAppealPages] = useState(1);
  const [totalAppeals, setTotalAppeals] = useState(null);

  useEffect(() => {
    fetchAppeals();
  }, [filters]);

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

  return {
    appeals,
    totalAppealPages,
    totalAppeals,
    appealLoading,
    fetchAppeals,
  };
}