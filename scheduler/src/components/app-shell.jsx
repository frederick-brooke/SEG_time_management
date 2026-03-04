"use client";

import { AppSidebar } from "@/src/components/app-sidebar";
import { SiteHeader } from "@/src/components/site-header";
import {
  SidebarProvider,
  SidebarInset,
} from "@/src/components/animate-ui/components/radix/sidebar";

export function AppShell({ children }) {
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
