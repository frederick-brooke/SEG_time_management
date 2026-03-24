"use client";
import { useState } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import SearchPanel from "@/components/search-page/search-panel";

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function PagesLayout({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <SidebarProvider
      open={sidebarOpen}              // ← lowercase s, the state variable
      onOpenChange={setSidebarOpen}
      className=""
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
        background: "#070b18",
      } as React.CSSProperties}       // ← cast needed for CSS custom properties
    >
      {/* Sidebar disappears when search is open */}
      {!searchOpen && (
        <AppSidebar
          variant="inset"
          onSearchClick={() => setSearchOpen(true)}
        />
      )}

      {/* Search panel replaces sidebar */}
      {searchOpen && (
        <SearchPanel
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
        />
      )}

      <SidebarInset
        className=""
        style={{
          background: "transparent",
          minHeight: "100vh",
        }}
      >
        <div className="p-2">
          <SidebarTrigger
            className="text-white"
            onClick={() => setSidebarOpen(prev => !prev)}
          />
        </div>
        {children}
        <div id="modal-root"></div>
      </SidebarInset>

    </SidebarProvider>
  );
}