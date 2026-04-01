"use client";

import { useState, useEffect, Suspense, ChangeEvent, FormEvent } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, LogIn, Loader2 } from "lucide-react";
import BannedPage from "@/components/admin/BanMessagePage";

interface FormInputProps {
  label: string;
  type?: "text" | "password" | "email";
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
}

/**
 * Renders a stylized, accessible input field with an associated label.
 *
 * @param {FormInputProps} props - Component properties for the input field
 * @returns {JSX.Element} A labeled input element with focus styling
 */
function FormInput({
  label,
  type = "text",
  name,
  value,
  onChange,
  placeholder,
  required = false,
}: FormInputProps) {
  return (
    <div className="group flex flex-col">
      <label className="text-xs font-bold tracking-wider text-white/60 uppercase mb-2 group-focus-within:text-blue-400 transition-colors">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 p-4 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all shadow-inner"
      />
    </div>
  );
}

/**
 * Renders an error message box with an alert icon.
 *
 * @param {{ message: string | null }} props - Component properties containing the error message text
 * @returns {JSX.Element | null} An error alert element, or null if no message is present
 */
function ErrorAlert({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <div className="mb-6 p-4 bg-red-500/10 text-red-300 text-sm rounded-xl border border-red-500/20 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
      <AlertCircle size={18} className="shrink-0" />
      <p>{message}</p>
    </div>
  );
}

/**
 * Renders a full-screen loading spinner with a deep background.
 *
 * @returns {JSX.Element} A centered loading spinner element
 */
function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#07070a]">
      <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
    </div>
  );
}

/**
 * Resolves the post-login destination by checking user preferences.
 * Falls back to the dashboard if the preferences check fails.
 *
 * @returns {Promise<string>} The path to redirect the user to after login
 */
async function resolvePostLoginPath(): Promise<string> {
  try {
    const response = await fetch("/api/preferences/check");
    const data = await response.json();
    return data.hasPreferences ? "/dashboard" : "/quiz";
  } catch {
    return "/dashboard";
  }
}

/**
 * Determines the error message to display for a given signIn error code.
 *
 * @param {string} errorCode - The error code returned by next-auth signIn
 * @returns {string} A human-readable error message
 */
function resolveSignInError(errorCode: string): string {
  if (errorCode === "Banned") return "Your account has been banned.";
  return "Invalid email/username or password.";
}

/**
 * Main form component managing authentication state, logic, and rendering.
 *
 * @returns {JSX.Element} The interactive login form
 */
function LoginForm() {
  const router = useRouter();
  const { status } = useSession();
  const searchParams = useSearchParams();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [showBannedInfo, setShowBannedInfo] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  useEffect(() => {
    if (searchParams.get("error") === "AccessDenied") {
      setError("Access denied. Please check your credentials.");
    }
  }, [searchParams]);

  const handleSignInError = (errorCode: string) => {
    setError(resolveSignInError(errorCode));
    if (errorCode === "Banned") setShowBannedInfo(true);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    const result = await signIn("credentials", {
      redirect: false,
      identifier,
      password,
    });

    if (result?.error) {
      handleSignInError(result.error);
      setIsPending(false);
      return;
    }

    const destination = await resolvePostLoginPath();
    router.refresh();
    router.push(destination);
  };

  if (status === "loading" || status === "authenticated") {
    return <FullScreenLoader />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#07070a] px-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <form
          onSubmit={handleSubmit}
          className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl backdrop-blur-2xl"
        >
          <LoginHeader />
          <ErrorAlert message={error} />
          <div className="space-y-5 mb-8">
            <FormInput
              label="Email or Username"
              name="identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. jsmith or john@example.com"
              required
            />
            <FormInput
              label="Password"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <SubmitButton isPending={isPending} />
          <div className="mt-6 text-center text-sm font-medium">
            <Link
              href="/forgot-password"
              className="text-white/50 hover:text-blue-400 transition-colors"
            >
              Forgot your password?
            </Link>
          </div>
           <div className="mt-3 text-center text-sm text-white/50">
              Don't have an account?{" "}
              <Link href="/register" className="text-blue-400 hover:text-blue-300 transition-colors font-semibold">
                Sign up
              </Link>
            </div>
        </form>

        {showBannedInfo && <BannedPage />}
      </div>
    </div>
  );
}

/**
 * Renders the icon and heading section at the top of the login form.
 *
 * @returns {JSX.Element} The login form header with icon and title
 */
function LoginHeader() {
  return (
    <div className="text-center mb-8">
      <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
        <LogIn size={28} className="text-blue-400 drop-shadow-md" />
      </div>
      <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 mb-2">
        Welcome Back
      </h1>
      <p className="text-white/50 text-sm font-medium">
        Enter your credentials to access your orbit.
      </p>
    </div>
  );
}

/**
 * Renders the form submit button with a loading state.
 *
 * @param {{ isPending: boolean }} props - Whether a login request is in progress
 * @returns {JSX.Element} A submit button that reflects the current pending state
 */
function SubmitButton({ isPending }: { isPending: boolean }) {
  return (
    <button
      type="submit"
      disabled={isPending}
      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-4 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.3)] disabled:opacity-50 disabled:pointer-events-none"
    >
      {isPending && <Loader2 size={18} className="animate-spin" />}
      {isPending ? "Authenticating..." : "Initiate Launch"}
    </button>
  );
}

/**
 * Root login page wrapper that provides Suspense boundaries for Next.js routing.
 *
 * @returns {JSX.Element} The fully wrapped login page with suspense fallback
 */
export default function LoginPage() {
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <LoginForm />
    </Suspense>
  );
}