"use client";

/**
 * useLocationSearch hook
 *
 * Debounced location search hook for fetching autocomplete suggestions
 * from the OpenRouteService API with loading and error state handling.
 */

import { useState, useEffect, useCallback } from "react";

/**
 * Represents a location search result from the OpenRouteService API.
 */
export interface LocationFeature {
  geometry: {
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: {
    name: string;
    city: string;
    display: string;
  };
}

/**
 * State returned by useLocationSearch hook.
 */
interface LocationSearchState {
  suggestions: LocationFeature[];
  error: string | null;
  loading: boolean;
}

/**
 * Complete return type of useLocationSearch hook.
 */
interface UseLocationSearchReturn extends LocationSearchState {
  searchQuery: string;
  handleLocationSearch: (text: string) => void;
}

/**
 * Fetches location suggestions from API and validates response.
 * Returns suggestions array or throws error with description.
 */
export async function performLocationSearch(
  query: string
): Promise<LocationFeature[]> {
  const res = await fetch(
    `/api/location/search?q=${encodeURIComponent(query)}`
  );

  if (!res.ok) throw new Error("Location search failed");

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

/**
 * Executes location search and updates state with results or errors.
 */
export async function executeSearch(
  text: string,
  setSuggestions: (suggestions: LocationFeature[]) => void,
  setError: (error: string | null) => void,
  setLoading: (loading: boolean) => void
): Promise<void> {
  try {
    const results = await performLocationSearch(text);
    setSuggestions(results);
    setError(null);
  } catch (err) {
    setSuggestions([]);
    const message = err instanceof Error ? err.message : "Search error";
    setError(message);
  } finally {
    setLoading(false);
  }
}

/**
 * Hook for debounced location search with suggestions.
 *
 * Provides search functionality for location autocomplete with:
 * - 400ms debounce delay to avoid excessive API calls
 * - Minimum 3-character threshold before searching
 * - Automatic error handling and state management
 *
 * @returns {UseLocationSearchReturn} Search state and handler
 *
 * @example
 * const { searchQuery, suggestions, handleLocationSearch } = useLocationSearch();
 *
 * return (
 *   <Input
 *     value={searchQuery}
 *     onChange={(e) => handleLocationSearch(e.target.value)}
 *     placeholder="Search location..."
 *   />
 * );
 */
export function useLocationSearch(): UseLocationSearchReturn {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<LocationFeature[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<
    ReturnType<typeof setTimeout> | null
  >(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [debounceTimer]);

  const handleLocationSearch = useCallback(
    (text: string) => {
      setSearchQuery(text);

      if (debounceTimer) clearTimeout(debounceTimer);

      const isQueryTooShort = text.length < 3;
      if (isQueryTooShort) {
        setSuggestions([]);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      const timer = setTimeout(() => {
        executeSearch(text, setSuggestions, setError, setLoading);
      }, 400);

      setDebounceTimer(timer);
    },
    [debounceTimer]
  );

  return {
    searchQuery,
    suggestions,
    error,
    loading,
    handleLocationSearch,
  };
}
