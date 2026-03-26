"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { validatePassword } from "@/lib/password";
import { KeyRound, AlertCircle, CheckCircle2 } from "lucide-react";

// ── DRY UI Sub-Components ──────────────────────────────────────────────────────
function FormInput({ label, type = "text", name, value, onChange, placeholder, required }: any) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold tracking-wide text-white/55 uppercase block">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full bg-white/5 border border-white/10 text-white placeholder-white/25 p-3.5 rounded-xl"
      />
    </div>
  );
}

// ── Client Component 
function ResetPasswordContent() {
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
      setMessage("No reset token provided.");
    }
  }, [token]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);

    if (!token) return;

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
      setMessage("Password reset successful.");
    } catch {
      setStatus("error");
      setMessage("Something went wrong.");
    }
  };

  if (!token) {
    return (
      <div className="p-8 text-center text-red-400">
        Invalid or missing token.
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f]">
      <form onSubmit={handleSubmit} className="p-8 rounded-xl bg-white/5 w-full max-w-md">
        <h1 className="text-white text-2xl mb-4">Reset Password</h1>

        {message && <p className="mb-4 text-sm">{message}</p>}

        <FormInput
          label="New Password"
          type="password"
          name="password"
          value={password}
          onChange={(e: any) => setPassword(e.target.value)}
          required
        />

        <FormInput
          label="Confirm Password"
          type="password"
          name="confirmPassword"
          value={confirmPassword}
          onChange={(e: any) => setConfirmPassword(e.target.value)}
          required
        />

        <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded">
          {status === "sending" ? "Saving..." : "Save Password"}
        </button>
      </form>
    </div>
  );
}

// ── Wrapper with Suspense ──────────────────────────────────────────────────────
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}