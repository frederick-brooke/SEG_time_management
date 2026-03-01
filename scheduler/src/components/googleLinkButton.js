"use client";

import { signIn } from "next-auth/react";

export default function GoogleLinkButton({ isConnected }) {
  if (isConnected) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
        <span className="text-sm font-medium text-green-700">
          Google Calendar Connected
        </span>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn("google")}
      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-all"
    >
      <img
        src="https://www.google.com/favicon.ico"
        alt="Google"
        className="w-4 h-4"
      />
      <span className="text-sm font-medium text-gray-700">
        Link Google Calendar
      </span>
    </button>
  );
}
