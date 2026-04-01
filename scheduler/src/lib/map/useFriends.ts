"use client";

import { useEffect, useState } from "react";
import { Friend } from "./types";

interface FriendsState {
  friends: Friend[];
  error: string | null;
  loading: boolean;
}

/**
 * Validates the API response and extracts friend data.
 * Returns empty array for unauthenticated users (401), throws for other errors.
 */
export async function validateFriendsResponse(response: Response): Promise<Friend[]> {
  if (response.ok) return response.json();
  if (response.status === 401) return []; // Unauthenticated, use empty array
  throw new Error(`Failed to fetch friends: ${response.status}`);
}

/**
 * Hook that fetches the user's friends from the API and returns the result.
 * Used by MapView to populate friend locations on the map.
 */
export function useFriends(): FriendsState {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/friends");
        const friendsData = await validateFriendsResponse(response);
        setFriends(friendsData);
      } catch (err) {
        console.error("Error fetching friends:", err);
        const message = err instanceof Error ? err.message : "Failed to fetch friends";
        setError(message);
        setFriends([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFriends();
  }, []);

  return { friends, error, loading };
}
