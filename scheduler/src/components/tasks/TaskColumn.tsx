/**
 * Task Column component
 */

import { TaskCard } from "./TaskCard";

/**
 * Single column in the task board, rendering the list of TaskCards.
 * @param {string} title The display name of the column.
 * @param {any[]} tasks The list of tasks to render in the column.
 * @param {string} status The status identifier for the column.
 * @param {Function} onToggle Callback to toggle a task's status.
 * @param {Function} onView Callback to open the task view dialog.
 * @param {Function} onEdit Callback to open the task edit dialog.
 * @param {Function} onDelete Callback to trigger task deletion.
 * @param {string | null} highlightId Optional task ID to highlight.
 */
export function TaskColumn({
	title,
	tasks,
	status,
	onToggle,
	onView,
	onEdit,
	onDelete,
	highlightId,
}) {
	return (
		<div
			className={`flex-1 min-w-[240px] rounded-lg border p-4 flex flex-col h-[calc(100vh-280px)] ${
				status === "overdue"
					? "bg-red-500/5 border-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.05)]"
					: "bg-white/[0.03] border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.02)]"
			}`}
		>
			<div className="mb-6 flex justify-between items-end border-b border-white/5 gap-1 px-2">
				<h3
					className={`font-black text-sm uppercase tracking-[0.4em] ${status === "overdue" ? "text-red-400" : "text-white/80"}`}
				>
					{title}
				</h3>
				<p className="text-[10px] font-black text-white/20 uppercase tracking-widest">
					{tasks.length} {tasks.length === 1 ? "task" : "tasks"}
				</p>
			</div>

			<div className="space-y-4 overflow-y-auto pr-2 flex-1 custom-scrollbar">
				{tasks.length === 0 ? (
					<div className="text-center py-12 text-muted-foreground text-sm">
						No tasks
					</div>
				) : (
					tasks.map((task) => (
						<TaskCard
							key={task.id}
							task={task}
							isDashboard={false}
							className={
								String(highlightId) === String(task.id)
									? "animate-lunar-burst"
									: ""
							}
							onToggle={onToggle}
							onView={onView}
							onEdit={onEdit}
							onDelete={onDelete}
						/>
					))
				)}
			</div>
		</div>
	);
}
