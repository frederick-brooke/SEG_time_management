"use client";

/**
 * Unscheduled Panel component
 */

import { format } from "date-fns";
import { getNextOccurrenceDeadline } from "@/lib/scheduling/taskSchedulingUtils";
import { Button } from "../ui/Button";

// DeadlineBadge
function DeadlineBadge({ task, events }: { task: any; events: any[] }) {
	const now = new Date();

	if (task.dueDate) {
		const due = new Date(task.dueDate);
		const daysLeft = Math.ceil(
			(due.getTime() - now.getTime()) / 86_400_000,
		);
		const urgent = daysLeft <= 3;
		return (
			<span
				className="text-xs font-semibold"
				style={{ color: urgent ? "#f87171" : "rgba(148,163,255,0.5)" }}
			>
				{urgent ? "⚠️ " : ""}Due {format(due, "MMM d, yyyy")}
				{daysLeft === 0
					? " · today"
					: daysLeft < 0
						? " · overdue"
						: urgent
							? ` · ${daysLeft}d left`
							: ""}
			</span>
		);
	}

	if (task.eventId && task.relativeOffsetDays != null) {
		const linked = events.find((e: any) => e.id === task.eventId);
		if (linked) {
			const nextDeadline = getNextOccurrenceDeadline(
				linked,
				task.relativeOffsetDays,
				now,
			);
			const deadline =
				nextDeadline ??
				(() => {
					const d = new Date(linked.start);
					d.setDate(d.getDate() + (task.relativeOffsetDays ?? 0));
					return d;
				})();
			const daysLeft = Math.ceil(
				(deadline.getTime() - now.getTime()) / 86_400_000,
			);
			const urgent = daysLeft <= 3;
			return (
				<span
					className="text-xs font-semibold"
					style={{
						color: urgent ? "#f87171" : "rgba(148,163,255,0.5)",
					}}
				>
					{urgent ? "⚠️ " : ""}Finish by{" "}
					{format(deadline, "MMM d, yyyy")}
					{daysLeft === 0
						? " · today"
						: daysLeft < 0
							? " · overdue"
							: urgent
								? ` · ${daysLeft}d left`
								: ""}
				</span>
			);
		}
	}

	return (
		<span
			className="text-xs italic"
			style={{ color: "rgba(148,163,255,0.35)" }}
		>
			No deadline
		</span>
	);
}

// UnscheduledPanel
interface UnscheduledPanelProps {
	unscheduledTasks: any[];
	scheduleLogs: any[];
	events: any[];
	categories: any[];
	onTaskClick: (task: any) => void;
	onEditLog: (log: any) => void;
	onDeleteLog: (logId: string) => void;
}

export default function UnscheduledPanel({
	unscheduledTasks,
	scheduleLogs,
	events,
	categories,
	onTaskClick,
	onEditLog,
	onDeleteLog,
}: UnscheduledPanelProps) {
	return (
		<div className="w-64 flex-shrink-0 flex flex-col gap-4 sticky top-4 self-start">
			{/* Unscheduled Tasks */}
			<div className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-md rounded-2xl p-4">
				<h3 className="text-xs font-bold uppercase tracking-widest mb-3 text-[rgba(147,197,253,0.45)]">
					Unscheduled Tasks
				</h3>
				{unscheduledTasks.length === 0 ? (
					<p
						className="text-xs"
						style={{ color: "rgba(148,163,255,0.35)" }}
					>
						All tasks are scheduled!
					</p>
				) : (
					<div className="flex flex-col gap-2.5 max-h-96 overflow-y-auto">
						{unscheduledTasks.map((t: any) => {
							const linkedEvent = t.eventId
								? events.find((e: any) => e.id === t.eventId)
								: null;
							const linkedCat = linkedEvent
								? categories.find(
										(c: any) =>
											c.name === linkedEvent.category,
									)
								: null;
							const tagColor = linkedCat?.color ?? null;

							return (
								<div
									key={t.id}
									className="group cursor-pointer transition-all rounded-xl"
									onClick={() => onTaskClick(t)}
									style={{
										border: "1px solid rgba(147, 197, 253, 0.25)",
										background: "rgba(255,255,255,0.02)",
										transition:
											"border-color 0.15s, background 0.15s",
									}}
									onMouseEnter={(e) => {
										(
											e.currentTarget as HTMLDivElement
										).style.background =
											"rgba(147, 197, 253, 0.08)";
										(
											e.currentTarget as HTMLDivElement
										).style.borderColor =
											"rgba(147, 197, 253, 0.4)";
									}}
									onMouseLeave={(e) => {
										(
											e.currentTarget as HTMLDivElement
										).style.background =
											"rgba(255,255,255,0.02)";
										(
											e.currentTarget as HTMLDivElement
										).style.borderColor =
											"rgba(147, 197, 253, 0.25)";
									}}
								>
									{tagColor && (
										<div
											className="h-0.5 w-full opacity-80"
											style={{
												backgroundColor: tagColor,
											}}
										/>
									)}
									<div className="p-3.5">
										<div className="flex items-center justify-between mb-2">
											<p
												className="text-sm font-semibold truncate"
												style={{
													color: "rgba(220,225,255,0.9)",
												}}
											>
												{t.title}
											</p>
											<span
												className="text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-1"
												style={{
													color: "rgba(148,163,255,0.8)",
												}}
											>
												Schedule →
											</span>
										</div>
										<div className="flex items-center gap-2 flex-wrap">
											{linkedCat && (
												<span
													className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
													style={{
														backgroundColor:
															tagColor!,
													}}
												>
													{linkedCat.name}
												</span>
											)}
											<span
												className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
													t.priority === "High"
														? "bg-red-500/15 text-red-400 border-red-500/25"
														: t.priority ===
															  "Medium"
															? "bg-orange-400/15 text-orange-400 border-orange-400/25"
															: "bg-green-400/10 text-green-400 border-green-400/20"
												}`}
											>
												{t.priority}
											</span>
											<DeadlineBadge
												task={t}
												events={events}
											/>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>

			{/* Schedule Log */}
			<div className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-md rounded-2xl p-4">
				<h3 className="text-xs font-bold uppercase tracking-widest mb-3 text-[rgba(147,197,253,0.45)]">
					Schedule Log
				</h3>
				{scheduleLogs.length === 0 ? (
					<p
						className="text-xs"
						style={{ color: "rgba(148,163,255,0.35)" }}
					>
						No schedules created yet.
					</p>
				) : (
					<div className="flex flex-col gap-3 max-h-96 overflow-y-auto">
						{scheduleLogs.map((log) => (
							<div
								key={log.id}
								className="p-3 rounded-xl bg-white/[0.025] border border-white/[0.07]"
							>
								<div className="flex items-center justify-between mb-1">
									<span
										className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
											log.mode === "day"
												? "bg-[rgba(220,225,255,0.1)] text-[rgba(220,225,255,0.8)] border-[rgba(220,225,255,0.15)]"
												: "bg-[rgba(147,197,253,0.15)] text-[rgba(147,197,253,0.9)] border-[rgba(147,197,253,0.25)]"
										}`}
									>
										{log.mode === "day" ? "Day" : "Week"}
									</span>
									<span className="text-xs text-[rgba(147,197,253,0.4)]">
										{format(
											new Date(log.scheduledAt),
											"MMM d, h:mm a",
										)}
									</span>
								</div>
								<p className="text-sm font-semibold text-[rgba(220,225,255,0.85)]">
									{log.dateLabel}
								</p>
								<p className="text-xs mb-2 text-[rgba(147,197,253,0.45)]">
									{log.taskIds.length} task
									{log.taskIds.length !== 1 ? "s" : ""}
								</p>
								<div className="flex gap-2">
									<Button
										onClick={() => onEditLog(log)}
										className="flex-1 text-xs py-1.5 rounded-lg font-bold transition-all bg-[rgba(147,197,253,0.12)] text-[rgba(147,197,253,0.9)] border border-[rgba(147,197,253,0.2)] hover:bg-[rgba(147,197,253,0.2)]"
									>
										Edit
									</Button>
									<Button
										onClick={() => onDeleteLog(log.id)}
										className="flex-1 text-xs py-1.5 rounded-lg font-bold transition-all bg-[rgba(239,68,68,0.08)] text-red-400 border border-[rgba(239,68,68,0.18)] hover:bg-[rgba(239,68,68,0.15)]"
									>
										Delete
									</Button>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
