"use client";

import { useEffect, useState } from "react";
import { Friend } from "./types";

interface FriendsState {
  friends: Friend[];
  error: string | null;
  loading: boolean;
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
        if (!response.ok) {
          if (response.status === 401) {
            // User not authenticated, just use empty friends array
            setFriends([]);
            return;
          }
          throw new Error(`Failed to fetch friends: ${response.status}`);
        }

        const friendsData = await response.json();
        setFriends(friendsData);
      } catch (err) {
        console.error("Error fetching friends:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch friends");
        setFriends([]); // Fallback to empty array
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, []);

  return { friends, error, loading };
}
