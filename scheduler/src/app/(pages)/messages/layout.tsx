"use client";

/**
 * @file layout.tsx
 * @description Responsive shell for the messages section.
 * On desktop, renders a fixed 380px sidebar alongside the conversation view.
 * On mobile, toggles between the sidebar and the active conversation full-screen,
 * hiding the sidebar when a conversation is open and vice versa.
 */
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import UserSearch from "components/messaging/UserSearch";
import ConversationList from "components/messaging/ConversationList";

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);

  return isMobile;
}

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const conversationId = params?.conversationId as string | undefined;
  const isMobile = useIsMobile();

  const SidebarContent = (
    <>
      <div className="p-4 shrink-0 border-b border-white/[0.06]">
        <h2 className="lunar-header text-2xl mb-1">Messages</h2>
        <p className="lunar-label-subtitle mb-3">Your conversations</p>
        <UserSearch />
      </div>
      <div className="flex-1 overflow-y-auto">
        <ConversationList />
      </div>
    </>
  );

  return (
      <div className="flex h-full overflow-hidden text-white/90">

        {/* Desktop: static 380px sidebar always visible */}
        {!isMobile && (
          <aside className="flex flex-col w-[380px] shrink-0 border-r border-white/[0.06] overflow-hidden">
            {SidebarContent}
          </aside>
        )}

        {/* Mobile: conversation list shown when no chat is open */}
        {isMobile && !conversationId && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {SidebarContent}
          </div>
        )}

        {/* Conversation view: full width on mobile, flex-1 on desktop */}
        {(!isMobile || conversationId) && (
          <main className="flex-1 flex flex-col overflow-hidden min-w-0">
            {isMobile && conversationId && (
              <div className="shrink-0 px-3 py-2 border-b border-white/[0.06]">
                <Button
                  onClick={() => router.push("/messages")}
                  className="flex items-center gap-1.5 text-sm transition-colors text-[rgba(148,163,255,0.7)] hover:text-[rgba(148,163,255,1)]"
                >
                  ← Back
                </Button>
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