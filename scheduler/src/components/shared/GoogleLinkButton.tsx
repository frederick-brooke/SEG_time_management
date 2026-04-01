"use client";
import { signIn } from "next-auth/react";

export default function GoogleLinkButton({ isConnected }: { isConnected: boolean }) {
  if (isConnected) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
          <span className="text-sm font-medium text-emerald-300">
            Google Calendar Connected
          </span>
        </div>
        <Button
          onClick={() => signIn("google", { callbackUrl: "/calendar" })}
          className="text-xs text-white/30 hover:text-white/50 transition-colors text-left px-1"
        >
          Having sync issues? Reconnect →
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={() => signIn("google", { callbackUrl: "/calendar" })}
      className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all"
    >
      <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
      <span className="text-sm font-medium text-white/60">
        Link Google Calendar
      </span>
    </Button>
  );
}