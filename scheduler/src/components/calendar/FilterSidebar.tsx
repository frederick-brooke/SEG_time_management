"use client";

import { Button } from "@/components/ui/Button";

/**
 * FilterSidebar — sticky sidebar for filtering calendar items by task type and category.
 */

interface Filter {
	key: string;
	label: string;
	color: string;
}

const TASK_FILTERS: Filter[] = [
	{ key: "tasks", label: "Tasks", color: "#93c5fd" },
	{ key: "priorityTasks", label: "Priority Tasks", color: "#f87171" },
	{ key: "completed", label: "Completed", color: "rgba(147,197,253,0.4)" },
];

interface Props {
	activeFilters: Record<string, boolean>;
	categories: { id: string; name: string; color: string }[];
	categoryFilters: Record<string, boolean>;
	onToggleFilter: (key: string) => void;
	onToggleCategory: (id: string) => void;
	onManageCategories: () => void;
}

/** Styled checkbox div that shows a ✓ when active. Colour is applied dynamically via the style prop. */
function FilterCheckbox({
	color,
	active,
	onToggle,
}: {
	color: string;
	active: boolean;
	onToggle: () => void;
}) {
	return (
		<div
			className="w-4 h-4 rounded flex items-center justify-center transition-all flex-shrink-0 cursor-pointer"
			style={{
				backgroundColor: active ? color : "transparent",
				border: `2px solid ${active ? color : "rgba(147,197,253,0.25)"}`,
				boxShadow: active ? `0 0 6px ${color}55` : "none",
				transition: "all 0.15s",
			}}
			onClick={onToggle}
		>
			{active && (
				<span className="text-[#0a0f1e] text-[10px] font-bold leading-none">
					✓
				</span>
			)}
		</div>
	);
}

/**
 * Renders filter toggles for task types (Tasks, Priority Tasks, Completed)
 * and per-category toggles for all user-defined event categories.
 */
export default function FilterSidebar({
	activeFilters,
	categories,
	categoryFilters,
	onToggleFilter,
	onToggleCategory,
	onManageCategories,
}: Props) {
	return (
		<div className="w-56 flex-shrink-0">
			<div className="sticky top-4 flex flex-col gap-4 rounded-2xl p-4 bg-white/[0.03] border border-white/[0.08] backdrop-blur-md">
				{/* Tasks section */}
				<div>
					<h3 className="text-xs font-bold uppercase tracking-widest mb-3 text-[rgba(147,197,253,0.45)]">
						Tasks
					</h3>
					<div className="flex flex-col gap-3">
						{TASK_FILTERS.map((f) => (
							<label
								key={f.key}
								className="flex items-center gap-2 cursor-pointer group"
							>
								<FilterCheckbox
									color={f.color}
									active={activeFilters[f.key]}
									onToggle={() => onToggleFilter(f.key)}
								/>
								<span
									className="text-sm transition-colors"
									style={{
										color: activeFilters[f.key]
											? "rgba(220,225,255,0.9)"
											: "rgba(147,197,253,0.55)",
									}}
								>
									{f.label}
								</span>
							</label>
						))}
					</div>
				</div>

				{/* Divider */}
				<div className="border-t border-white/[0.07]" />

				{/* Categories section */}
				<div>
					<div className="flex items-center justify-between mb-3">
						<h3 className="text-xs font-bold uppercase tracking-widest text-[rgba(147,197,253,0.45)]">
							Categories
						</h3>
						<Button
							onClick={onManageCategories}
							className="text-xs font-bold transition-colors text-[rgba(147,197,253,0.7)] hover:text-[rgba(147,197,253,1)]"
						>
							+ Manage
						</Button>
					</div>
					<div className="flex flex-col gap-3">
						{categories.map((cat) => (
							<label
								key={cat.id}
								className="flex items-center gap-2 cursor-pointer group"
							>
								<FilterCheckbox
									color={cat.color}
									active={categoryFilters[cat.id]}
									onToggle={() => onToggleCategory(cat.id)}
								/>
								<span
									className="text-sm transition-colors"
									style={{
										color: categoryFilters[cat.id]
											? "rgba(220,225,255,0.9)"
											: "rgba(147,197,253,0.55)",
									}}
								>
									{cat.name}
								</span>
							</label>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
