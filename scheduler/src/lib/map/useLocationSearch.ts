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
 *   <input
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
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [debounceTimer]);

  const handleLocationSearch = useCallback(
    (text: string) => {
      setSearchQuery(text);

      // Clear previous timer
      if (debounceTimer) clearTimeout(debounceTimer);

      // Clear suggestions if text is too short
      if (text.length < 3) {
        setSuggestions([]);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      // Debounce the API call
      const timer = setTimeout(async () => {
        try {
          const res = await fetch(`/api/location/search?q=${encodeURIComponent(text)}`);

          if (!res.ok) {
            setSuggestions([]);
            setError("Location search failed");
            setLoading(false);
            return;
          }

          const data = await res.json();
          setSuggestions(Array.isArray(data) ? data : []);
          setError(null);
          setLoading(false);
        } catch (err) {
          setSuggestions([]);
          setError(err instanceof Error ? err.message : "Search error");
          setLoading(false);
        }
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
