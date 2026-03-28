"use client";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { SiteHeader } from "@/components/navigation/site-header";
import {SidebarProvider,SidebarInset} from "@/components/animate-ui/components/radix/sidebar";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";                          
import { checkUpcomingEventNotifications } from "@/app/actions/calendar/calendarNotifications";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { data: session } = useSession();                            
  const userId = session?.user?.id;                                    

  useEffect(() => {
    if (!userId) return;                                              

    console.log("🔔 AppShell mounted, calling notification check");
    checkUpcomingEventNotifications(userId).then(res => console.log("🔔 result:", res));

    const POLL_INTERVAL_MS = 3 * 60 * 1000;
    const interval = setInterval(() => {
      checkUpcomingEventNotifications(userId);
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [userId]);                                                        

  return (
    <SidebarProvider
      open={sidebarOpen}
      onOpenChange={setSidebarOpen}
      className=""
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar
        variant="inset"
        onSearchClick={() => {}}
      />

      <SidebarInset className="">
        <SiteHeader />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}