/**
 * @file useEventSearch.ts
 *
 * Hook for searching calendar events by query string.
 */

import { useState, useCallback } from "react";

export function useEventSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    setShowSearchResults(true);
    const res = await fetch(`/api/calendar/events?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    setSearchResults(
      data.map((e: any) => ({ ...e, start: new Date(e.start), end: new Date(e.end) })),
    );
  }, []);

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
  };

  return {
    searchQuery,
    searchResults,
    showSearchResults,
    handleSearch,
    clearSearch,
    showSearchResultsFor: () => searchQuery && setShowSearchResults(true),
  };
}