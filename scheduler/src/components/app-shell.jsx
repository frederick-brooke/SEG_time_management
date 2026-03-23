"use client";

import { AppSidebar } from "@/src/components/app-sidebar";
import { SiteHeader } from "@/src/components/site-header";
import {
  SidebarProvider,
  SidebarInset,
} from "@/src/components/animate-ui/components/radix/sidebar";
import { useEffect } from "react";
import { checkUpcomingEventNotifications } from "@/src/app/actions/calendar/calendarNotifications";

export function AppShell({ children }) {
  useEffect(() => {
    console.log("🔔 AppShell mounted, calling notification check");
    checkUpcomingEventNotifications().then(res => console.log("🔔 result:", res));

    const POLL_INTERVAL_MS = 3 * 60 * 1000;
    const interval = setInterval(() => {
      checkUpcomingEventNotifications();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);
  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      }}
    >
      <AppSidebar variant="inset" />

      <SidebarInset>
        <SiteHeader />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
