"use client";
import { useState } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import SearchPanel from "@/components/search-page/search-panel";

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";

/**
 * PagesLayout Component
 *
 * Main application layout wrapper that provides:
 * - Sidebar navigation
 * - Search panel overlay
 * - Content rendering area
 *
 * Handles UI state for:
 * - Sidebar visibility (expand/collapse)
 * - Search panel toggle (replaces sidebar when active)
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Page content to be rendered inside the layout
 * @returns {JSX.Element} The application layout with sidebar and content area
 */
export default function PagesLayout({ children }: { children: React.ReactNode }) {
	const [searchOpen, setSearchOpen] = useState(false);		// Controls whether the search panel is visible
	const [sidebarOpen, setSidebarOpen] = useState(true);		// Controls sidebar open/collapsed state

	return (
		<SidebarProvider
			open={sidebarOpen}              // Sidebar state (controlled)
			onOpenChange={setSidebarOpen}
			className=""
			style={{
				"--sidebar-width": "calc(var(--spacing) * 72)",
				"--header-height": "calc(var(--spacing) * 12)",
				background: "#070b18",
			} as React.CSSProperties}       
		>
			{/* Sidebar disappears when search is open */}
			{!searchOpen && (
				<AppSidebar variant="inset" onSearchClick={() => setSearchOpen(true)}/>
			)}

			{/* Search panel replaces sidebar */}
			{searchOpen && (
				<SearchPanel open={searchOpen} onClose={() => setSearchOpen(false)}/>
			)}

			<SidebarInset className="" style={{background: "transparent", minHeight: "100vh",}}>
				{/* Sidebar toggle trigger */}
				<div className="p-2">
					<SidebarTrigger className="text-white" onClick={() => setSidebarOpen(prev => !prev)}/>
				</div>

				{/* Render page-specific content */}
				{children}

				{/* Portal root for modals */}
				<div id="modal-root"/>
			</SidebarInset>
		</SidebarProvider>
	);
}