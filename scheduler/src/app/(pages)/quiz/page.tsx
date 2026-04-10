"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LunarCard } from "@/components/ui/LunarCard";
import { Button } from "@/components/ui/Button";
import StarBackground from "@/components/StarBackground";

const DAYS = [
	{ label: "Monday", abbr: "Mon" },
	{ label: "Tuesday", abbr: "Tue" },
	{ label: "Wednesday", abbr: "Wed" },
	{ label: "Thursday", abbr: "Thu" },
	{ label: "Friday", abbr: "Fri" },
	{ label: "Saturday", abbr: "Sat" },
	{ label: "Sunday", abbr: "Sun" },
];

const DEFAULT_FORM_DATA = {
	workStartTime: "09:00",
	workEndTime: "17:00",
	daysOff: [] as string[],
	sessionLength: 90,
	breakLength: 15,
	breaksPerDay: 3,
	taskOrder: "hard-first",
	maxTasksPerDay: 8,
	defaultTaskDuration: 60,
	reminderDays: 2,
};

const STEP_TITLES = [
	"Work Schedule",
	"Breaks & Sessions",
	"Task Preferences",
	"Reminders",
];

export default function QuizPage() {
	const router = useRouter();
	const [currentStep, setCurrentStep] = useState(1);
	const [isLoading, setIsLoading] = useState(false);
	const [formData, setFormData] = useState(DEFAULT_FORM_DATA);

	const handleChange = (field: string, value: any) =>
		setFormData((prev) => ({ ...prev, [field]: value }));

	const handleNext = () => currentStep < 4 && setCurrentStep((s) => s + 1);
	const handleBack = () => currentStep > 1 && setCurrentStep((s) => s - 1);

	const savePreferences = async (data: typeof DEFAULT_FORM_DATA) => {
		const sessionRes = await fetch("/api/auth/session");
		const session = await sessionRes.json();
		if (!session?.user?.id) throw new Error("Failed to get user session");

		const res = await fetch("/api/preferences", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ userID: session.user.id, ...data }),
		});
		if (!res.ok) throw new Error("Failed to save preferences");
	};

	const handleSubmit = async () => {
		setIsLoading(true);
		try {
			await savePreferences(formData);
			router.push("/dashboard");
		} catch (error) {
			console.error(error);
			alert("Failed to save preferences. Please try again.");
			setIsLoading(false);
		}
	};

	// Skip, save defaults and go straight to dashboard
	const handleSkip = async () => {
		setIsLoading(true);
		try {
			await savePreferences(DEFAULT_FORM_DATA);
			router.push("/dashboard");
		} catch (error) {
			console.error(error);
			alert("Failed to save preferences. Please try again.");
			setIsLoading(false);
		}
	};

	// Derived: working window label
	const workingWindowLabel = (() => {
		const [sh, sm] = formData.workStartTime.split(":").map(Number);
		const [eh, em] = formData.workEndTime.split(":").map(Number);
		const total = eh * 60 + em - (sh * 60 + sm);
		if (total <= 0) return "";
		return `${Math.floor(total / 60)}h${total % 60 > 0 ? ` ${total % 60}m` : ""} working window`;
	})();

	return (
		<div className="min-h-screen flex items-center justify-center bg-[#0B0F1A] px-4 relative overflow-hidden">
			{" "}
			<StarBackground /> {/* Background glows */}
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.15),transparent_40%)]" />
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(147,51,234,0.12),transparent_40%)]" />
			<LunarCard className="max-w-2xl w-full p-8 rounded-[2.5em] backdrop-blur-xl bg-white/5 border border-white/10 shadow-[0_0_40px_rgba(59,130,246,0.15)]">
				{/* Header: progress + skip */}
				<div className="mb-8">
					<div className="flex justify-between items-center text-xs text-white/50 mb-2">
						<span className="lunar-page-subtitle">
							Step {currentStep} of 4
						</span>
						<div className="flex items-center gap-3">
							<span className="lunar-page-subtitle">
								{Math.round((currentStep / 4) * 100)}%
							</span>
							{/* Skip button */}
							<Button
								onClick={handleSkip}
								disabled={isLoading}
								className="lunar-page-subtitle px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white/70 hover:bg-white/10 transition-all text-xs disabled:opacity-30"
							>
								Skip setup →
							</Button>
						</div>
					</div>

					{/* Progress bar */}
					<div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
						<div
							className="h-full bg-gradient-to-r from-blue-500 to-purple-500 shadow-[0_0_12px_rgba(59,130,246,0.6)] transition-all duration-300"
							style={{ width: `${(currentStep / 4) * 100}%` }}
						/>
					</div>

					{/* Step dots */}
					<div className="flex justify-between mt-4">
						{STEP_TITLES.map((title, i) => (
							<div
								key={i}
								className="flex flex-col items-center gap-1"
							>
								<div
									className={`lunar-page-subtitle w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all
                  ${
						i + 1 < currentStep
							? "bg-gradient-to-br from-blue-500 to-purple-500 text-white"
							: i + 1 === currentStep
								? "bg-blue-500 text-white ring-4 ring-blue-500/20 scale-110"
								: "bg-white/10 text-white/30"
					}`}
								>
									{i + 1 < currentStep ? "✓" : i + 1}
								</div>
								<span
									className={`lunar-page-subtitle text-[10px] font-medium hidden sm:block ${i + 1 === currentStep ? "text-blue-400" : "text-white/30"}`}
								>
									{title}
								</span>
							</div>
						))}
					</div>
				</div>

				{/* Step title */}
				<h2 className="lunar-header text-2xl font-black text-white tracking-tight mb-6">
					{STEP_TITLES[currentStep - 1]}
				</h2>

				{/* Step 1: Work Schedule */}
				{currentStep === 1 && (
					<div className="flex flex-col gap-5">
						<div>
							<label className="block text-sm font-semibold text-white/70 mb-2">
								When do you start working?
							</label>
							<input
								type="time"
								value={formData.workStartTime}
								onChange={(e) =>
									handleChange(
										"workStartTime",
										e.target.value,
									)
								}
								className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-400/60 transition-colors"
							/>
						</div>

						<div>
							<label className="block text-sm font-semibold text-white/70 mb-2">
								When do you stop working?
							</label>
							<input
								type="time"
								value={formData.workEndTime}
								onChange={(e) =>
									handleChange("workEndTime", e.target.value)
								}
								className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-400/60 transition-colors"
							/>
							{workingWindowLabel && (
								<p className="text-xs text-blue-400/80 mt-1.5 lunar-page-subtitle">
									{workingWindowLabel}
								</p>
							)}
						</div>

						<div>
							<label className="block text-sm font-semibold text-white/70 mb-3">
								Which days are you off?
							</label>
							<div className="grid grid-cols-2 gap-2">
								{DAYS.map(({ label, abbr }) => {
									const checked =
										formData.daysOff.includes(abbr);
									return (
										<Button
											key={abbr}
											type="button"
											onClick={() =>
												handleChange(
													"daysOff",
													checked
														? formData.daysOff.filter(
																(d) =>
																	d !== abbr,
															)
														: [
																...formData.daysOff,
																abbr,
															],
												)
											}
											className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all
                        ${
							checked
								? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-400/40 text-white"
								: "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:border-white/20"
						}`}
										>
											<div
												className={`w-4 h-4 rounded-md flex items-center justify-center flex-shrink-0 transition-all
                        ${checked ? "bg-gradient-to-br from-blue-500 to-purple-500" : "border-2 border-white/20"}`}
											>
												{checked && (
													<span className="text-white text-[10px] font-bold">
														✓
													</span>
												)}
											</div>
											<span className="text-sm font-medium">
												{label}
											</span>
										</Button>
									);
								})}
							</div>
							{formData.daysOff.length > 0 && (
								<p className="text-xs text-blue-400 font-medium mt-2 lunar-page-subtitle">
									Days off: {formData.daysOff.join(", ")}
								</p>
							)}
						</div>
					</div>
				)}

				{/* Step 2: Breaks & Sessions */}
				{currentStep === 2 && (
					<div className="flex flex-col gap-5">
						<div className="bg-white/5 p-4 rounded-2xl border border-white/10">
							<label className="block text-sm font-semibold text-white/70 mb-3">
								How long do you work before taking a break?
							</label>
							<div className="flex items-center gap-3">
								<input
									type="range"
									min="15"
									max="180"
									step="15"
									value={formData.sessionLength}
									onChange={(e) =>
										handleChange(
											"sessionLength",
											+e.target.value,
										)
									}
									className="flex-1 accent-blue-500"
								/>
								<span className="lunar-page-subtitle text-sm font-bold text-blue-400 w-16 text-right">
									{formData.sessionLength} min
								</span>
							</div>
							<div className="flex justify-between text-[10px] text-white/30 mt-1 lunar-page-subtitle">
								<span>15m</span>
								<span>1h</span>
								<span>2h</span>
								<span>3h</span>
							</div>
						</div>

						<div className="bg-white/5 p-4 rounded-2xl border border-white/10">
							<label className="block text-sm font-semibold text-white/70 mb-3">
								How long are your breaks?
							</label>
							<div className="flex items-center gap-3">
								<input
									type="range"
									min="5"
									max="60"
									step="5"
									value={formData.breakLength}
									onChange={(e) =>
										handleChange(
											"breakLength",
											+e.target.value,
										)
									}
									className="flex-1 accent-purple-500"
								/>
								<span className="lunar-page-subtitle text-sm font-bold text-purple-400 w-16 text-right">
									{formData.breakLength} min
								</span>
							</div>
							<div className="flex justify-between text-[10px] text-white/30 mt-1 lunar-page-subtitle">
								<span>5m</span>
								<span>15m</span>
								<span>30m</span>
								<span>60m</span>
							</div>
						</div>

						<div>
							<label className="block text-sm font-semibold text-white/70 mb-2">
								How many breaks per day?
							</label>
							<div className="flex gap-2">
								{[1, 2, 3, 4, 5, 6].map((n) => (
									<Button
										key={n}
										type="button"
										onClick={() =>
											handleChange("breaksPerDay", n)
										}
										className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all
							${
								formData.breaksPerDay === n
									? "bg-gradient-to-br from-blue-500 to-purple-500 text-white border-transparent"
									: "bg-white/5 text-white/60 border-white/10 hover:border-white/30"
							}`}
									>
										{n}
									</Button>
								))}
							</div>
						</div>

						{/* Preview */}
						<div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-4 border border-blue-400/20">
							<p className="lunar-page-subtitle text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">
								Schedule Preview
							</p>
							<p className="text-sm text-white/80">
								Work{" "}
								<strong className="text-white">
									{formData.sessionLength}min
								</strong>{" "}
								→ Break{" "}
								<strong className="text-white">
									{formData.breakLength}min
								</strong>
								, repeated up to{" "}
								<strong className="text-white">
									{formData.breaksPerDay}×
								</strong>{" "}
								per day
							</p>
							<p className="lunar-page-subtitle text-xs text-white/40 mt-1">
								~
								{formData.sessionLength * formData.breaksPerDay}
								min effective work time per day
							</p>
						</div>
					</div>
				)}

				{/* ── Step 3: Task Preferences ── */}
				{currentStep === 3 && (
					<div className="flex flex-col gap-5">
						<div>
							<label className="block text-sm font-semibold text-white/70 mb-3">
								How do you prefer to order tasks?
							</label>
							<div className="flex flex-col gap-2">
								{[
									{
										value: "hard-first",
										label: "Hard tasks first",
										desc: "High priority & long tasks scheduled early",
									},
									{
										value: "easy-first",
										label: "Easy tasks first",
										desc: "Shorter, lower priority tasks to warm up",
									},
									{
										value: "deadline",
										label: "Deadline first",
										desc: "Tasks closest to their due date scheduled first",
									},
									{
										value: "duration_asc",
										label: "Shortest first",
										desc: "Get quick wins early in the day",
									},
									{
										value: "duration_desc",
										label: "Longest first",
										desc: "Tackle big tasks while energy is high",
									},
								].map(({ value, label, desc }) => (
									<Button
										key={value}
										type="button"
										onClick={() =>
											handleChange("taskOrder", value)
										}
										className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all
                      ${
							formData.taskOrder === value
								? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-400/40"
								: "bg-white/5 border-white/10 hover:border-white/20"
						}`}
									>
										<div
											className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border-2 transition-all
                      ${formData.taskOrder === value ? "border-blue-400 bg-blue-500" : "border-white/20"}`}
										>
											{formData.taskOrder === value && (
												<div className="w-1.5 h-1.5 rounded-full bg-white" />
											)}
										</div>
										<div>
											<p className="text-sm font-semibold text-white">
												{label}
											</p>
											<p className="text-xs text-white/40">
												{desc}
											</p>
										</div>
									</Button>
								))}
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-semibold text-white/70 mb-2">
									Max tasks per day
								</label>
								<input
									type="number"
									value={formData.maxTasksPerDay}
									min="1"
									max="20"
									onChange={(e) =>
										handleChange(
											"maxTasksPerDay",
											parseInt(e.target.value),
										)
									}
									className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-400/60 transition-colors"
								/>
							</div>

							<div>
								<label className="block text-sm font-semibold text-white/70 mb-2">
									Default task duration
								</label>
								<div className="relative">
									<input
										type="number"
										value={formData.defaultTaskDuration}
										min="15"
										max="240"
										onChange={(e) =>
											handleChange(
												"defaultTaskDuration",
												parseInt(e.target.value),
											)
										}
										className="w-full px-3 py-2.5 pr-12 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-400/60 transition-colors"
									/>
									<span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/30 lunar-page-subtitle">
										min
									</span>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Step 4: Reminders */}
				{currentStep === 4 && (
					<div className="flex flex-col gap-5">
						<div>
							<label className="block text-sm font-semibold text-white/70 mb-3">
								How many days before a deadline should we remind
								you?
							</label>
							<div className="flex gap-2 flex-wrap">
								{[0, 1, 2, 3, 5, 7, 14].map((n) => (
									<Button
										key={n}
										type="button"
										onClick={() =>
											handleChange("reminderDays", n)
										}
										className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all
							${
								formData.reminderDays === n
									? "bg-gradient-to-br from-blue-500 to-purple-500 text-white border-transparent"
									: "bg-white/5 text-white/60 border-white/10 hover:border-white/30"
							}`}
									>
										{n === 0 ? "Day of" : `${n}d`}
									</Button>
								))}
							</div>

							<p className="text-sm text-white/50 mt-3 lunar-page-subtitle">
								{formData.reminderDays === 0
									? "You'll be reminded on the day the task is due."
									: `You'll be reminded ${formData.reminderDays} day${formData.reminderDays !== 1 ? "s" : ""} before tasks are due.`}
							</p>
						</div>

						{/* Summary */}
						<div className="bg-white/5 rounded-2xl p-5 border border-white/10 mt-2">
							<p className="lunar-page-subtitle text-xs font-bold text-white/30 uppercase tracking-widest mb-4">
								Your Preferences Summary
							</p>

							<div className="grid grid-cols-2 gap-4 text-sm">
								{[
									{
										label: "Work hours",
										value: `${formData.workStartTime} – ${formData.workEndTime}`,
									},
									{
										label: "Days off",
										value:
											formData.daysOff.length > 0
												? formData.daysOff.join(", ")
												: "None",
									},
									{
										label: "Session",
										value: `${formData.sessionLength}min work, ${formData.breakLength}min break`,
									},
									{
										label: "Task order",
										value: formData.taskOrder.replace(
											/-|_/g,
											" ",
										),
									},
									{
										label: "Max tasks/day",
										value: String(formData.maxTasksPerDay),
									},
									{
										label: "Reminders",
										value:
											formData.reminderDays === 0
												? "Day of"
												: `${formData.reminderDays}d before`,
									},
								].map(({ label, value }) => (
									<div key={label}>
										<span className="lunar-page-subtitle text-xs text-white/30 block mb-0.5">
											{label}
										</span>
										<p className="font-semibold text-white capitalize">
											{value}
										</p>
									</div>
								))}
							</div>
						</div>
					</div>
				)}

				{/* Navigation*/}
				<div className="lunar-page-subtitle flex justify-between mt-8">
					<Button
						onClick={handleBack}
						disabled={currentStep === 1}
						className="px-5 py-2 rounded-full bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 disabled:opacity-30 transition-all"
					>
						Back
					</Button>

					{currentStep < 4 ? (
						<Button
							onClick={handleNext}
							className="px-6 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold shadow-lg hover:scale-105 active:scale-95 transition-all"
						>
							Next →
						</Button>
					) : (
						<Button
							onClick={handleSubmit}
							disabled={isLoading}
							className="px-6 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
						>
							{isLoading ? "Saving…" : "Complete Setup ✓"}
						</Button>
					)}
				</div>
			</LunarCard>
		</div>
	);
}
