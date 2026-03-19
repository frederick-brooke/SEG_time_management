"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { validatePassword } from "lib/password";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No reset token provided. Please use the link from your email.");
    }
  }, [token]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);

    if (!token) {
      setStatus("error");
      setMessage("Missing token.");
      return;
    }

    if (!password) {
      setStatus("error");
      setMessage("Please provide a new password.");
      return;
    }

    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setStatus("error");
      setMessage(passwordError);
      return;
    }

    setStatus("sending");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (!res.ok) {
        const body = await res.json();
        setStatus("error");
        setMessage(body?.error ?? "Unable to reset password.");
        return;
      }

      setStatus("success");
      setMessage("Your password has been reset. You can now sign in.");
    } catch (err) {
      setStatus("error");
      setMessage("Unable to reset password. Please try again later.");
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded bg-white p-8 shadow">
          <h1 className="mb-6 text-2xl font-bold text-center">Reset Password</h1>
          <p className="text-red-600">No reset token provided. Please use the link sent to your email.</p>
          <div className="mt-6 text-center">
            <Link href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
              Request a new reset link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded bg-white p-8 shadow"
      >
        <h1 className="mb-6 text-2xl font-bold text-center">Set a new password</h1>

        {message && (
          <p
            className={`mb-4 text-sm ${
              status === "error" ? "text-red-500" : "text-green-600"
            }`}
          >
            {message}
          </p>
        )}

        <label className="mb-2 block font-medium">New password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-2 w-full rounded border px-3 py-2"
          required
        />
        <ul className="mb-4 text-xs text-gray-500 list-disc list-inside">
          <li>Minimum 6 characters</li>
          <li>At least one uppercase letter</li>
          <li>At least one lowercase letter</li>
          <li>At least one number or symbol</li>
        </ul>

        <label className="mb-2 block font-medium">Confirm password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="mb-6 w-full rounded border px-3 py-2"
          required
        />

        <button
          type="submit"
          className="w-full rounded bg-blue-600 px-4 py-2 text-white"
          disabled={status === "sending"}
        >
          {status === "sending" ? "Saving…" : "Save new password"}
        </button>

        <div className="mt-4 text-center text-sm text-gray-600">
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Back to sign in
          </Link>
        </div>
      </form>
    </div>
  );
}
