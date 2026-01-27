"use client";

import Image from "next/image";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";

export default function Home() {
  const { data: session, status } = useSession();

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        
        {/* Next.js Logo */}
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />

        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            {session ? `Welcome back, ${session.user.name || 'User'}` : "Time Management App"}
          </h1>
          
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            {session 
              ? `You are signed in as ${session.user.email}. You can now access your personalized calendar and schedule.`
              : "To get started with your schedule, please sign in with your Google account."}
          </p>
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
      </main>
    </div>
  );
}