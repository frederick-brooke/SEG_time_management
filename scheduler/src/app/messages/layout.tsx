"use client";
import { useRouter } from "next/navigation";
import UserSearch from "components/messaging/UserSearch";
import ConversationList from "components/messaging/ConversationList";

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <div className="flex h-screen" style={{ background: "linear-gradient(160deg, #080c14 0%, #0a0f1e 50%, #06080f 100%)" }}>
      <aside className="w-80 flex flex-col" style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="p-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
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
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
    </div>
  );
}