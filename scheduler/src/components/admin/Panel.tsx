import { useEffect } from "react";
import { IconX } from "@tabler/icons-react";
import { Button } from "../ui/Button";
import { useUI } from "@/context/UIContext";

/**
 * Panel
 *
 * Reusable slide-in panel component (right-side drawer).
 * Handles:
 * - Open/close state with smooth transitions
 * - Backdrop click to close
 * - Preventing propagation for inner clicks
 * - Rendering dynamic content via children
 *
 * @param {Object} props
 * @param {boolean} props.open - Controls panel visibility
 * @param {Function} props.onClose - Callback to close the panel
 * @param {string} props.title - Panel header title
 * @param {React.ReactNode} props.children - Content rendered inside the panel
 *
 * @returns {JSX.Element} Slide-over panel UI
 */
export default function Panel({ open, onClose, title, children }) {
	const { setIsModalOpen } = useUI();

	useEffect(() => {
		setIsModalOpen(open);
		return () => setIsModalOpen(false);
	}, [open, setIsModalOpen]);

	return (
		// Backdrop (fades in/out, disables interaction when closed)
		<div
			className={`fixed inset-0 z-[950] bg-black/50 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
			onClick={onClose}
		>
			<div
				className={`absolute right-0 top-0 h-full w-[600px] bg-white shadow-2xl p-6 overflow-y-auto transform transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-semibold">{title}</h2>
					{/* Close button */}
					<Button onClick={onClose}>
						{" "}
						<IconX />{" "}
					</Button>
				</div>
				{children} {/* Dynamic panel content */}
			</div>
		</div>
	);
}
