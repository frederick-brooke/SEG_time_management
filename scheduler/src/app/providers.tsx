'use client';

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
