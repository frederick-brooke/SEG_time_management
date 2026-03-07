"use client";
import { useRouter } from "next/navigation";
import UserSearch from "components/messaging/UserSearch";
import ConversationList from "components/messaging/ConversationList";

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <div className="flex h-screen bg-white">
      <aside className="w-80 border-r border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 mb-3"
          >
            ←
          </button>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Messages</h2>
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