"use client";

import Image from "next/image";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";

export default function Home() {
  const { data: session, status } = useSession();

  const loading = status === "loading";
  const loggedIn = !!session?.user;

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-6">
      <main className="w-full max-w-xl rounded-2xl bg-white p-8 shadow">
        <h1 className="text-2xl font-semibold">Scheduler Demo</h1>
        <p className="mt-2 text-zinc-600">
          Auth status + Google Calendar linking (temporary in-memory store).
        </p>

        <div className="mt-6 rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Session</span>
            <span className="text-sm text-zinc-600">
              {loading ? "Loading..." : loggedIn ? "Logged in" : "Logged out"}
            </span>
          </div>

          {!loading && loggedIn && (
            <div className="mt-3 text-sm text-zinc-700 space-y-1">
              <div><span className="font-medium">Email:</span> {session.user.email}</div>
              <div>
                <span className="font-medium">Google connected:</span>{" "}
                {session.user.googleConnected ? "Yes ✅" : "No ❌"}
              </div>
              <div><span className="font-medium">User ID:</span> {session.user.id}</div>
            </div>
          )}

          {!loading && !loggedIn && (
            <div className="mt-3 text-sm text-zinc-700">
              You are not signed in.
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          {status === "loading" ? (
            <p className="text-zinc-400">Loading...</p>
          ) : !session ? (
            /* SIGN IN BUTTON */
            <button
              onClick={() => signIn("google")}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-black text-white px-8 transition-colors hover:bg-[#383838] dark:bg-white dark:text-black dark:hover:bg-[#ccc] md:w-auto"
            >
              Sign in with Google
            </button>
          ) : (
            /* SIGNED IN ACTIONS */
            <>
              <Link
                href="/calendar"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-black text-white px-8 transition-colors hover:bg-[#383838] dark:bg-white dark:text-black dark:hover:bg-[#ccc] md:w-auto"
              >
                Go to Calendar
              </Link>
              <button
                onClick={() => signOut()}
                className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-8 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-auto"
              >
                Sign out
              </button>
            </>
          )}
        </div>

        <p className="mt-6 text-xs text-zinc-500">
          Tip: after logging in, refresh this page to see session fields update.
        </p>
      </main>
    </div>
  );
}