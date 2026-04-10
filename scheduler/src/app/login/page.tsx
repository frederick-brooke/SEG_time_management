"use client";

/**
 * Client-side Login page.
 * Handles credential authentication via NextAuth, session routing logic,
 * error states (including banned users), and post-login navigation flow.
 */

import { useState, useEffect, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, LogIn } from "lucide-react";
import StarBackground from "@/components/StarBackground";

function FormInput({
	label,
	type = "text",
	name,
	value,
	onChange,
	placeholder,
	required,
}: any) {
	return (
		<div className="grid gap-2">
			<label className="lunar-label">{label}</label>
			<input
				type={type}
				name={name}
				value={value}
				onChange={onChange}
				placeholder={placeholder}
				required={required}
				className="lunar-input"
			/>
		</div>
	);
}

// Client Component (uses useSearchParams)
function LoginForm() {
	const router = useRouter();
	const { status } = useSession();
	const searchParams = useSearchParams();

	const [identifier, setIdentifier] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isPending, setIsPending] = useState(false);

	useEffect(() => {
		if (status === "authenticated") {
			const authError = searchParams.get("error");
			router.replace(
				authError ? `/dashboard?error=${authError}` : "/dashboard",
			);
		}
	}, [status, searchParams, router]);

	useEffect(() => {
		if (searchParams.get("error") === "AccessDenied") {
			setError("Access denied. Please check your credentials.");
		}
	}, [searchParams]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsPending(true);

		const result = await signIn("credentials", {
			redirect: false,
			identifier,
			password,
		});

		if (result?.error) {
			setIsPending(false);
			if (result.error === "Banned") {
				setError("Your account has been banned.");
			} else {
				setError("Invalid email/username or password.");
			}
			return;
		}

		try {
			const sessionRes = await fetch("/api/auth/session");
			const session = await sessionRes.json();

			if (!session?.user?.id) {
				setError("Failed to get user session.");
				setIsPending(false);
				return;
			}

			const prefsRes = await fetch(
				`/api/preferences/check?userId=${session.user.id}`,
			);
			const prefsData = await prefsRes.json();

			if (prefsData.hasPreferences) {
				router.push("/dashboard");
			} else {
				router.push("/quiz");
			}
		} catch (err) {
			setError("An unexpected error occurred during login.");
			setIsPending(false);
		}
	};

	if (status === "loading" || status === "authenticated") {
		return (
			<div className="flex min-h-screen items-center justify-center bg-[#0a0a0f]">
				<div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] px-4 relative overflow-hidden">
			<StarBackground />
			<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none" />

			<div className="w-full max-w-md relative z-10">
				<form
					onSubmit={handleSubmit}
					className="lunar-glass p-8 md:p-10"
				>
					<div className="text-center mb-8">
						<div className="w-16 h-16 bg-blue-300/10 border border-blue-300/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
							<LogIn size={28} className="text-blue-300" />
						</div>
						<h1 className="lunar-header mb-2">Welcome Back</h1>
						<p className="lunar-form-subtitle">
							Enter your credentials to access your orbit.
						</p>
					</div>

					{error && (
						<div className="mb-6 p-4 bg-red-500/10 text-red-300 text-sm rounded-xl border border-red-500/20 flex items-center gap-3">
							<AlertCircle size={18} />
							<p>{error}</p>
						</div>
					)}

					<div className="space-y-6 mb-8">
						<FormInput
							label="Email or Username"
							name="identifier"
							value={identifier}
							onChange={(e: any) => setIdentifier(e.target.value)}
							placeholder="e.g. jsmith or john@example.com"
							required
						/>
						<FormInput
							label="Password"
							type="password"
							name="password"
							value={password}
							onChange={(e: any) => setPassword(e.target.value)}
							placeholder="••••••••"
							required
						/>
					</div>

					<button
						type="submit"
						disabled={isPending}
						className="w-full px-6 py-3 rounded-2xl bg-blue-300 text-gray-950 font-semibold shadow-[0_0_30px_rgba(90,150,255,0.25)] hover:shadow-[0_0_50px_rgba(90,150,255,0.45)] transition disabled:opacity-50"
					>
						{isPending ? "Authenticating..." : "Initiate Launch"}
					</button>

					{/* Forgot password + Sign up links */}
					<div className="mt-6 flex flex-col items-center gap-3 text-sm">
						<Link
							href="/forgot-password"
							className="text-white/50 hover:text-white/80 transition-colors"
						>
							Forgot your password?
						</Link>
						<p className="text-white/30">
							Don&apos;t have an account?{" "}
							<Link
								href="/register"
								className="text-blue-300 hover:text-blue-300/80 transition-colors font-medium"
							>
								Sign up
							</Link>
						</p>
					</div>
				</form>
			</div>
		</div>
	);
}

// Page Wrapper with Suspense
export default function LoginPage() {
	return (
		<Suspense fallback={<div className="p-6 text-center">Loading...</div>}>
			<LoginForm />
		</Suspense>
	);
}
