"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { validatePassword } from "@/src/lib/password"; // Fixed alias
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
        className="w-full bg-white/5 border border-white/10 text-white placeholder-white/25 p-3.5 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all appearance-none shadow-[inset_0_0_15px_rgba(0,0,0,0.2)]"
      />
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
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

  // Missing Token View
  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] px-4 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/10 blur-[150px] rounded-full pointer-events-none" />
        <div className="w-full max-w-md relative z-10">
          <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8 md:p-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-xl text-center">
            <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Invalid Link</h1>
            <p className="text-white/50 text-sm mb-8">No reset token provided. Please use the exact link sent to your email.</p>
            <Link href="/forgot-password" className="inline-block w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold py-3 rounded-xl transition-all">
              Request a new link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Active Reset View
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] px-4 relative overflow-hidden">
      {/* Ambient Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <form
          onSubmit={handleSubmit}
          className="bg-white/[0.02] border border-white/10 rounded-3xl p-8 md:p-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-xl"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
              <KeyRound size={28} className="text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Reset Password</h1>
            <p className="text-white/50 text-sm">Secure your account with a new password.</p>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 text-sm ${
              status === "error" 
                ? "bg-red-500/10 text-red-300 border-red-500/20" 
                : "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
            }`}>
              {status === "error" ? <AlertCircle size={18} className="shrink-0" /> : <CheckCircle2 size={18} className="shrink-0" />}
              <p>{message}</p>
            </div>
          )}

          <div className="space-y-5 mb-8">
            <div>
              <FormInput label="New Password" type="password" name="password" value={password} onChange={(e: any) => setPassword(e.target.value)} placeholder="••••••••" required />
              <ul className="mt-2 text-[11px] text-white/30 list-disc list-inside grid grid-cols-2 gap-1">
                <li>Min 6 characters</li>
                <li>1 Uppercase</li>
                <li>1 Lowercase</li>
                <li>1 Number/Symbol</li>
              </ul>
            </div>

            <FormInput label="Confirm Password" type="password" name="confirmPassword" value={confirmPassword} onChange={(e: any) => setConfirmPassword(e.target.value)} placeholder="••••••••" required />
          </div>

          <button
            type="submit"
            disabled={status === "sending" || status === "success"}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {status === "sending" ? "Encrypting..." : "Save New Password"}
          </button>

          <div className="mt-8 pt-6 border-t border-white/10 text-center text-sm">
            <Link href="/login" className="font-bold text-white/50 hover:text-white transition-colors tracking-wide">
              RETURN TO LOGIN
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}