'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'


export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Still checking auth status

    if (session) {
      // User is logged in → go to dashboard
      router.push('/dashboard')
    } else {
      // User is NOT logged in → go to login
      router.push('/login')
    }
  }, [session, status, router])

  // Show loading while checking auth and redirecting
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

        <div className="mt-6 flex flex-col gap-3">
          {!loggedIn ? (
            <button
              onClick={() => signIn()} // uses your authOptions.pages.signIn (/login)
              className="w-full rounded-lg bg-black px-4 py-2 text-white"
            >
              Go to Login
            </button>
          ) : (
            <>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full rounded-lg bg-zinc-200 px-4 py-2"
              >
                Logout
              </button>

              <button
                onClick={() =>
                  signIn("google", { callbackUrl: "/" }) // starts Google OAuth
                }
                className="w-full rounded-lg border px-4 py-2"
              >
                Connect Google Calendar
              </button>
            </>
          )}
        </div>

        <p className="mt-6 text-xs text-zinc-500">
          Tip: after logging in, refresh this page to see session fields update.
        </p>
      </main>
    </div>
  )
}