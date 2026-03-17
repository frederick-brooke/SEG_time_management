"use client";

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
      className="flex h-screen overflow-hidden"
      style={{ background: "linear-gradient(160deg, #080c14 0%, #0a0f1e 50%, #06080f 100%)" }}
    >
      {/* Sidebar — fixed full screen on mobile, static 380px on desktop */}
      <aside
        className="flex flex-col shrink-0 transition-all duration-300 overflow-hidden"
        style={{
          width: sidebarOpen ? (isMobile ? "100vw" : "380px") : "0px",
          borderRight: sidebarOpen && !isMobile ? "1px solid rgba(255,255,255,0.06)" : "none",
          minWidth: 0,
          ...(isMobile && {
            position: "fixed",
            top: 0,
            left: 0,
            height: "100vh",
            zIndex: 50,
          }),
        }}
      >
        <div className="flex flex-col h-full" style={{ width: isMobile ? "100vw" : "380px" }}>
          <div className="p-4 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <button
              onClick={() => router.push("/dashboard")}
              className="text-sm flex items-center gap-1 mb-3 transition-colors"
              style={{ color: "rgba(148,163,255,0.5)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "rgba(148,163,255,0.9)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(148,163,255,0.5)")}
            >
              ←
            </button>
            <h2 className="text-lg font-bold mb-3" style={{ color: "rgba(220,225,255,0.9)" }}>Messages</h2>
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
          {isMobile && conversationId && (
            <div
              className="shrink-0 px-3 py-2"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <button
                onClick={() => {
                  setSidebarOpen(true);
                  router.push("/messages");
                }}
                className="flex items-center gap-1.5 text-sm transition-colors"
                style={{ color: "rgba(148,163,255,0.7)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "rgba(148,163,255,1)")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(148,163,255,0.7)")}
              >
                ← Back
              </button>
            </div>
          )}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            {children}
          </div>
        </main>
      )}
    </div>
  );
}