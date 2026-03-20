"use client";
import { useState } from "react";

import { AppSidebar } from "components/app-sidebar";
import SearchPanel from "@/components/search-page/search-panel";

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "components/ui/sidebar";

export default function PagesLayout({ children }) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
        background: "#070b18",
      }}
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

      <SidebarInset style={{
        background: "transparent",
        minHeight: "100vh",
      }}>
        <div className="p-2">
          <SidebarTrigger className="text-white"/>
        </div>
        {children}
        <div id="modal-root"></div>
      </SidebarInset>

    </SidebarProvider>
  );
}
