"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // NextAuth login via Credentials provider
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false, // so we can show errors nicely
    });

    setIsLoading(false);
    
    if (!res?.ok) {
      setError("Invalid email or password");
      return;
    }

    router.push("dashboard");
  }

  async function handleGoogle() {
    // Starts Google OAuth (for now it's sign-in; later Prisma will do real linking)
    await signIn("google", { callbackUrl: "/" });
  }

  async function handleRegister() {
    setError("");
    setIsLoading(true);

    const r = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    setIsLoading(false);

    if (!r.ok) {
      const data = await r.json().catch(() => ({}));
      setError(data.error || "Registration failed");
      return;
    }

    // auto login after register
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.ok) router.push("/");
    else setError("Registered, but login failed. Try signing in.");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="text-3xl font-bold text-center text-gray-900">Sign in</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Email/password is the main login. Google is for Calendar.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md disabled:opacity-50"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
              Sign up
            </Link>
          </p>
        </div>
        </form>

        <div className="pt-2">
          <button
            type="button"
            onClick={handleGoogle}
            className="w-full py-2 px-4 border rounded-md flex items-center justify-center gap-2"
          >
            Connect Google Calendar
          </button>
        </div>
      </div>
    </div>
  );
}