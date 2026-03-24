"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, AlertCircle } from "lucide-react";
import { validatePassword } from "@/lib/password";

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
export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setIsLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    if (!res.ok) {
      setIsLoading(false);
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Registration failed");
      return;
    }

    // Auto-login
    const loginResult = await signIn("credentials", { 
      identifier: email, // Updated to use our new 'identifier' logic
      password, 
      redirect: false 
    });

    if (loginResult?.ok) {
      window.location.href = "/quiz"; 
    } else {
      setIsLoading(false);
      setError("Account created, but login failed. Please try signing in manually.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] px-4 py-12 relative overflow-hidden">
      {/* Ambient Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <form
          onSubmit={handleSubmit}
          className="bg-white/[0.02] border border-white/10 rounded-3xl p-8 md:p-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-xl"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
              <UserPlus size={28} className="text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Join the Orbit</h1>
            <p className="text-white/50 text-sm">Create your account to start managing your time.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 text-red-300 text-sm rounded-xl border border-red-500/20 flex items-center gap-3">
              <AlertCircle size={18} className="shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-5 mb-8">
            <div>
              <FormInput label="Username" name="username" value={username} onChange={(e: any) => setUsername(e.target.value)} placeholder="e.g. spaceman" required />
              <p className="mt-2 text-[11px] text-white/30">3-20 characters. Letters, numbers, underscores, and hyphens only.</p>
            </div>
            
            <FormInput label="Email Address" type="email" name="email" value={email} onChange={(e: any) => setEmail(e.target.value)} placeholder="you@universe.com" required />
            
            <div>
              <FormInput label="Password" type="password" name="password" value={password} onChange={(e: any) => setPassword(e.target.value)} placeholder="••••••••" required />
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
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? "Preparing Launch..." : "Create Account"}
          </button>

          <div className="mt-8 pt-6 border-t border-white/10 text-center text-sm">
            <div className="text-white/40">
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-blue-400 hover:text-blue-300 transition-colors tracking-wide">
                SIGN IN
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}