"use client"; 
/**
 * Backwards-compatible wrapper for FriendMap.
 * 
 * Re-exports a dynamically imported CombinedMap component with preset props.
 * Useful when migrating legacy code without breaking existing imports.
 */

import dynamic from "next/dynamic";
import { Friend } from "@/src/lib/map";

interface FriendMapProps {
  friends: Friend[];
}

/**
 * Dynamically import the CombinedMap component to avoid issues
 */
const FriendMap = dynamic<FriendMapProps>(
  () =>
    import("@/src/components/map/CombinedMap").then((m) => ({
      default: ({ friends }: FriendMapProps) => (
        <m.CombinedMap 
          friends={friends}        
          events={[]}              
          defaultMode="friends"   
        />
      ),
    })),
  {
    ssr: false, 
    loading: () => (
      <div className="flex items-center justify-center h-[600px] bg-gray-50 rounded-lg">
        <p className="text-gray-500">Loading map...</p>
      </div>
    ),
  }
);

// Export the dynamic FriendMap for external usage
export { FriendMap };