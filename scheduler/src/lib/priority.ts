/**
 * Returns Tailwind styles based on task priority level.
 */

export const getPriorityStyle = (priority: string): string => {
	switch (priority) {
		case "High":
			return "bg-red-500/15 text-red-400 border-red-500/25 rounded-full";
		case "Medium":
			return "bg-orange-400/15 text-orange-400 border-orange-400/25 rounded-full";
		case "Low":
			return "bg-green-400/10 text-green-400 border-green-400/20 rounded-full";
		default:
			return "bg-slate-500/10 text-slate-400 border-slate-500/20 rounded-full";
	}
};
