/**
 * Client-side Reset Password page.
 * Handles token validation, password reset form submission,
 * and success/error state management for secure password updates.
 */

"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { validatePassword } from "@/lib/password";
import StarBackground from "@/components/StarBackground";

export function FormInput({
	label,
	type = "text",
	name,
	value,
	onChange,
	placeholder,
	required,
}: any) {
	return (
		<div className="space-y-2">
			<label htmlFor={name} className="lunar-label">
				{label}
			</label>
			<input
				type={type}
				id={name}
				name={name}
				value={value}
				onChange={onChange}
				placeholder={placeholder}
				required={required}
				className="lunar-input w-full"
			/>
		</div>
	);
}

// Client Component
export function ResetPasswordContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get("token");

	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [status, setStatus] = useState<
		"idle" | "sending" | "success" | "error"
	>("idle");
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

	const handleRedirectToLogin = () => {
		router.push("/login");
	};

	if (!token) {
		return (
			<div className="p-8 text-center lunar-item-error border rounded-xl">
				Invalid or missing token.
			</div>
		);
	}

	if (status === "success") {
		return (
			<div className="flex min-h-screen items-center justify-center bg-[#0a0a0f]">
				<div className="lunar-glass p-8 w-full max-w-md space-y-6 text-center">
					<h1 className="lunar-header text-3xl mb-6">
						Password Reset
					</h1>
					<div className="lunar-item-success border rounded-xl p-4">
						{message}
					</div>
					<p className="text-white/60 text-sm">
						Your password has been successfully updated. You can now
						sign in with your new password.
					</p>
					<button
						onClick={handleRedirectToLogin}
						className="lunar-button-primary w-full"
					>
						Return to Login
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-[#0a0a0f]">
			<form
				onSubmit={handleSubmit}
				className="lunar-glass p-8 w-full max-w-md space-y-6"
			>
				<h1 className="lunar-header text-3xl mb-6">Reset Password</h1>

				{message && (
					<div
						className="border rounded-xl p-4 text-sm lunar-item-error"
					>
						{message}
					</div>
				)}

				<FormInput
					label="New Password"
					type="password"
					name="password"
					value={password}
					onChange={(e: any) => setPassword(e.target.value)}
					required
				/>

				<ul className="mt-2 text-[11px] text-white/30 list-disc list-inside grid grid-cols-2 gap-1">
					<li>Min 6 characters</li>
					<li>1 Uppercase</li>
					<li>1 Lowercase</li>
					<li>1 Number/Symbol</li>
				</ul>

				<FormInput
					label="Confirm Password"
					type="password"
					name="confirmPassword"
					value={confirmPassword}
					onChange={(e: any) => setConfirmPassword(e.target.value)}
					required
				/>

				<button
					type="submit"
					className="lunar-button-primary w-full mt-8"
				>
					{status === "sending" ? "Saving..." : "Save Password"}
				</button>
			</form>
		</div>
	);
}

// Wrapper with suspense
export default function ResetPasswordPage() {
	return (
		<>
			<StarBackground />
			<Suspense
				fallback={<div className="p-8 text-center">Loading...</div>}
			>
				<ResetPasswordContent />
			</Suspense>
		</>
	);
}
