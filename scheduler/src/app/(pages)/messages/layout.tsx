"use client";

/**
 * @file layout.tsx
 * @description Responsive shell for the messages section.
 * On desktop, renders a fixed 380px sidebar alongside the conversation view.
 * On mobile, toggles between the sidebar and the active conversation full-screen,
 * hiding the sidebar when a conversation is open and vice versa.
 */

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";

import UserSearch from "components/messaging/UserSearch";
import ConversationList from "components/messaging/ConversationList";

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const conversationId = params?.conversationId as string | undefined;

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Show sidebar on desktop always; on mobile show sidebar only when no conversation is open
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(!conversationId);
      }
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [conversationId]);

  return (
    <div
      className="flex h-screen overflow-hidden bg-[linear-gradient(160deg,#080c14_0%,#0a0f1e_50%,#06080f_100%)]"
    >
      {/* Sidebar — fixed full screen on mobile, static 380px on desktop */}
      <aside
        className={`flex flex-col shrink-0 transition-all duration-300 overflow-hidden min-w-0 ${
          isMobile ? "fixed top-0 left-0 h-screen z-50" : ""
        } ${
          sidebarOpen && !isMobile ? "border-r border-white/[0.06]" : ""
        }`}
        style={{ width: sidebarOpen ? (isMobile ? "100vw" : "380px") : "0px" }}
      >
        <div className={`flex flex-col h-full ${isMobile ? "w-screen" : "w-[380px]"}`}>
          <div className="p-4 shrink-0 border-b border-white/[0.06]">
            <h2 className="text-lg font-bold mb-3 text-[rgba(220,225,255,0.9)]">Messages</h2>
            <UserSearch />
          </div>
          <div className="flex-1 overflow-y-auto">
            <ConversationList />
          </div>
        </div>
      </aside>

      {/* Main content — hidden on mobile when sidebar is open */}
      {(!isMobile || !sidebarOpen) && (
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            {children}
          </div>
        </main>
      )}
    </div>
  );
}