/**
 * @file ModuleEvents.tsx
 * @description Displays a scrollable list of upcoming module events.
 * Renders individual event cards with dynamic category styling and provides
 * edit/delete controls exclusively for the module owner.
 */

"use client";

import { Button } from "@/components/ui/Button";
import { Calendar, Pencil, Trash2 } from "lucide-react";
import { formatEventDate } from "@/lib/format";

/**
 * Represents the data structure for a module event.
 */
export interface ModuleEvent {
	id: string;
	moduleEventGroupId: string | null;
	title: string;
	description: string | null;
	start: Date;
	end: Date;
	category: string;
}

/**
 * Props for the EventRow component.
 */
interface EventRowProps {
	event: ModuleEvent;
	isOwner: boolean;
	onEdit: () => void;
	onDelete: () => void;
}

/**
 * Props for the ModuleEvents main component.
 */
interface ModuleEventsProps {
	events: ModuleEvent[];
	isOwner: boolean;
	onEdit: (event: ModuleEvent) => void;
	onDelete: (groupId: string) => void;
}

const CATEGORY_STYLES: Record<string, string> = {
	Lecture:
		"bg-blue-500/10 text-blue-400 border-blue-500/20 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]",
	Exam: "bg-red-500/10 text-red-400 border-red-500/20 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]",
	Deadline:
		"bg-amber-500/10 text-amber-400 border-amber-500/20 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]",
	Seminar:
		"bg-blue-500/10 text-blue-400 border-blue-500/20 drop-shadow-[0_0_8px_rgba(147,197,253,0.5)]",
	Meeting:
		"bg-emerald-500/10 text-emerald-400 border-emerald-500/20 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]",
};

const DEFAULT_CATEGORY_STYLE =
	"bg-blue-500/10 text-blue-400 border-blue-500/20 drop-shadow-[0_0_8px_rgba(147,197,253,0.5)]";

/**
 * Renders a single event row with optional owner edit/delete controls.
 *
 * @param {EventRowProps} props - Component props.
 * @returns {JSX.Element} Event row card.
 */
function EventRow({ event, isOwner, onEdit, onDelete }: EventRowProps) {
	const tagStyle = CATEGORY_STYLES[event.category] || DEFAULT_CATEGORY_STYLE;

	return (
		<div className="flex items-start justify-between p-4 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all rounded-xl gap-3">
			<div className="flex-1 min-w-0">
				<h3 className="font-bold text-white truncate text-sm">
					{event.title}
				</h3>
				{event.description && (
					<p className="text-xs text-white/40 mt-1 line-clamp-2">
						{event.description}
					</p>
				)}
				<div className="flex items-center gap-3 mt-3 flex-wrap">
					<span className="text-xs text-white/40 font-medium">
						📅 {formatEventDate(event.start)}
					</span>
					<span
						className={`text-[9px] px-2.5 py-0.5 rounded-full border font-black uppercase tracking-wider ${tagStyle}`}
					>
						{event.category}
					</span>
				</div>
			</div>

			{isOwner && (
				<div className="flex items-center gap-1 shrink-0">
					<Button
						onClick={onEdit}
						className="p-1.5 text-white/30 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
						title="Edit event"
						data-testid="edit-event-btn"
					>
						<Pencil size={14} />
					</Button>
					<Button
						onClick={onDelete}
						className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
						title="Delete event"
						data-testid="delete-event-btn"
					>
						<Trash2 size={14} />
					</Button>
				</div>
			)}
		</div>
	);
}

/**
 * Events section card for the module detail page.
 *
 * @param {ModuleEventsProps} props - Component props.
 * @returns {JSX.Element} Events list card.
 */
export default function ModuleEvents({
	events,
	isOwner,
	onEdit,
	onDelete,
}: ModuleEventsProps) {
	return (
		<div className="lunar-card p-6 mb-6">
			<h2 className="lunar-label mb-4 flex items-center gap-2 text-sm text-white">
				<Calendar
					size={16}
					className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
				/>{" "}
				Upcoming Events ({events.length})
			</h2>

			{events.length > 0 ? (
				<div className="max-h-80 overflow-y-auto space-y-2 pr-1 lunar-scroll">
					{events.map((event) => (
						<EventRow
							key={event.id}
							event={event}
							isOwner={isOwner}
							onEdit={() => onEdit(event)}
							onDelete={() =>
								event.moduleEventGroupId &&
								onDelete(event.moduleEventGroupId)
							}
						/>
					))}
				</div>
			) : (
				<p className="lunar-value text-center py-8">
					No events scheduled yet.
					{isOwner && " Create one using the button above!"}
				</p>
			)}
		</div>
	);
}
