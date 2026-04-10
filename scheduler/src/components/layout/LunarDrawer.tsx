"use client";
import { Button } from "../ui/Button";

/**
 *Renders a customizable drawer/modal component that slides in from the left, right, or bottom.
 *@param {Object} props - Component props.
 *@param {boolean} props.open - Whether the drawer is visible.
 *@param {Function} props.onClose - Callback to close the drawer.
 *@param {string} [props.side="left"] - The side the drawer slides from ("left", "right", or "bottom").
 *@param {string} [props.title] - The title text displayed in the drawer header.
 *@param {string} [props.width="w-full sm:w-[420px]"] - Width classes for side drawers (ignored for bottom).
 *@param {React.ReactNode} props.children - The content to render inside the drawer.
 *@returns {JSX.Element|null} The drawer component or null if closed.
 */
export default function LunarDrawer({
	open,
	onClose,
	side = "left",
	title,
	width = "w-full sm:w-[420px]",
	children,
}) {
	if (!open) return null;

	const isBottom = side.includes("bottom");
	const isRight = side.includes("right");

	const positionCls = isBottom
		? "inset-x-0 bottom-0 max-h-[85vh] rounded-t-3xl"
		: isRight
			? "inset-y-0 right-0"
			: "inset-y-0 left-0";

	const sizeCls = isBottom ? "w-full" : width;

	const justifyCls = isRight ? "justify-end" : "justify-start";

	return (
		<div
			className={`fixed inset-0 z-50 flex ${justifyCls} bg-black/60 backdrop-blur-sm`}
			onClick={onClose}
		>
			<div
				className={`fixed ${positionCls} ${sizeCls} flex flex-col bg-[#111629]/80 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden`}
				onClick={(e) => e.stopPropagation()}
			>
				{isBottom && (
					<div className="flex justify-center pt-3 pb-1 flex-shrink-0">
						<div className="w-10 h-1 rounded-full bg-white/20" />
					</div>
				)}

				<div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
					<h2 className="lunar-page-title text-2xl sm:text-3xl leading-tight">
						{title}
					</h2>
					<Button
						onClick={onClose}
						className="text-white/50 hover:text-white transition"
					>
						✕
					</Button>
				</div>

				<div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
					{children}
				</div>
			</div>
		</div>
	);
}
