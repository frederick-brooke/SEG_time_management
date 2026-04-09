'use client';

/**
 * Global app providers wrapper
 * Includes auth session and task progress context.
 */

import { SessionProvider } from "next-auth/react";
import { TaskProgressProvider } from "@/context/TaskProgressContext";

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <TaskProgressProvider>
        {children}
      </TaskProgressProvider>
    </SessionProvider>
  );
}
