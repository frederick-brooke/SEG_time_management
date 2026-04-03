/**
 * @file useSearchData.ts
 * @description Handles fetching of friends and group conversations.
 */

import { useEffect, useState } from "react";

export function useSearchData() {
  const [friends, setFriends] = useState([]);
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    /**
     * Fetches friends list.
     */
    const fetchFriends = async () => {
      try {
        const res = await fetch("/api/user/search");
        const data = await res.json();
        setFriends(data);
      } catch (err) {
        console.error("Failed to fetch friends", err);
      }
    };

    /**
     * Fetches group conversations.
     */
    const fetchGroups = async () => {
      try {
        const res = await fetch("/api/conversations");
        const data = await res.json();
        setGroups(data.filter((c: any) => c.isGroup));
      } catch (err) {
        console.error("Failed to fetch groups", err);
      }
    };

    fetchFriends();
    fetchGroups();
  }, []);

  return { friends, groups };
}