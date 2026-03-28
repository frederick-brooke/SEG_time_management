"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, AlertCircle, CheckCircle2, ChevronLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setStatus("success");
        setMessage("Recovery link transmitted. Check your inbox.");
      } else {
        const data = await res.json();
        setStatus("error");
        setMessage(data.error || "Failed to send recovery email.");
      }
    } catch (err) {
      setStatus("error");
      setMessage("System error. Please try again later.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] px-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8 md:p-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail size={28} className="text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Recover Access</h1>
            <p className="text-white/50 text-sm">Enter your email to receive a secure reset link.</p>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 text-sm ${
              status === "error" ? "bg-red-500/10 text-red-300 border-red-500/20" : "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
            }`}>
              {status === "error" ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
              <p>{message}</p>
            </div>
          )}

          {status !== "success" ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold tracking-wide text-white/55 uppercase block">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@universe.com"
                  className="w-full bg-white/5 border border-white/10 text-white p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={status === "sending"}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 rounded-xl transition-all disabled:opacity-50"
              >
                {status === "sending" ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          ) : (
            <Link href="/login" className="w-full inline-block bg-white/5 hover:bg-white/10 text-white text-center font-semibold py-3.5 rounded-xl transition-all">
              Return to Login
            </Link>
          )}

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <Link href="/login" className="text-sm font-medium text-white/40 hover:text-white flex items-center justify-center gap-2 transition-colors">
              <ChevronLeft size={16} /> Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}