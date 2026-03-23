"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import BannedPage from "@/src/components/ban-message-page";

export default function LoginPage() {
  const router = useRouter();
  const { status } = useSession();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [showBannedInfo, setShowBannedInfo] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      const authError = searchParams.get("error");

      if (authError) {
        router.replace(`/dashboard?error=${authError}`);
      } else {
        router.replace("/dashboard");
      }
    }
  }, [status, searchParams, router]);

  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError === "AccessDenied") {
      setError("Access denied. Please check your credentials.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);     

    const result = await signIn("credentials", {    // stores whether login succeeded or failed
      redirect: false,    // dont automatically redirect, let us handle it
      email,              // the values from the form
      password,
    });

    if (result?.error) {      // if result exists, check its error property
      setError("Invalid email or password");
    } else {                  // if login succeeded
      const sessionRes = await fetch("/api/auth/session");    // fetches the raw, current session from the API
      const session = await sessionRes.json();    // converts the response to JSON. Now session contains the user's data like their ID, email

      router.push("/dashboard");

      if (!session?.user?.id) {
        setError("Failed to get user session");
        return;
      }

      const prefsRes = await fetch(
        `/api/preferences/check?userId=${session.user.id}`,     // calls our preferences API to check if this user has filled out the quiz
      );
      const prefsData = await prefsRes.json();    // converts the response to JSON

      if (prefsData.hasPreferences) {
        router.push("/dashboard");
      } else {
        router.push("/quiz");
      }
    }

    if (result?.error) {
      if (result.error === "Banned") {
        setError("Your account has been banned.");
        //display the banned page
        setShowBannedInfo(true);
      } else {
        setError("Invalid email or password");
      }
    }
  };

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p>Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded bg-white p-8 shadow"
      >
        <h1 className="mb-6 text-2xl font-bold text-center">Sign In</h1>

        {error && <p className="mb-4 text-red-500">{error}</p>}

        <label className="mb-2 block font-medium">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded border px-3 py-2"
          required
        />

        <label className="mb-2 block font-medium">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-6 w-full rounded border px-3 py-2"
          required
        />

        <button
          type="submit"
          className="w-full rounded bg-blue-600 px-4 py-2 text-white"
        >
          Sign In
        </button>

        <div className="mt-4 text-center text-sm text-gray-600">
          <div className="mb-2">
            <Link
              href="/forgot-password"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Forgot your password?
            </Link>
          </div>
          <div>
            Don't have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign up
            </Link>
          </div>
        </div>
      </form>

      {showBannedInfo && <BannedPage/>}
    </div>
  );
}
