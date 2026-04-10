import { useEffect, useState } from "react";
import { AlertTriangle, ShieldOff, X } from "lucide-react";
import { Button } from "../ui/Button";

/**
 * AppealForm
 *
 * Form allowing users to submit an appeal for their ban.
 * Handles:
 * - Input state
 * - API submission
 * - Loading state
 *
 * @param {Object} props
 * @param {string} props.reportId - Related report ID
 * @param {Function} props.onClose - Closes the form
 */
export default function AppealForm({ reportId, onClose }) {
	const [description, setDescription] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleSubmit() {
		setLoading(true);
		try {
			await fetch("/api/appeal", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ description, reportId }),
				credentials: "include",
			});
			alert("Appeal submitted.");
			onClose();
		} catch {
			alert("Failed to submit appeal");
		} finally {
			setLoading(false);
		}
	}

	return (
		<>
			<div className="flex justify-between">
				<h2 className="lunar-header text-lg text-white">
					Submit Appeal
				</h2>
				<Button onClick={onClose}>
					<X />
				</Button>
			</div>

			<textarea
				value={description}
				onChange={(e) => setDescription(e.target.value)}
				className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-2"
			/>

			<div className="flex justify-end gap-2">
				<Button
					onClick={onClose}
					className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition"
				>
					Cancel
				</Button>
				<Button
					onClick={handleSubmit}
					disabled={!description || loading}
					className="px-6 py-3 rounded-2xl bg-blue-300 text-gray-950 font-semibold shadow-[0_0_30px_rgba(90,150,255,0.25)] hover:shadow-[0_0_50px_rgba(90,150,255,0.45)] transition disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{loading ? "Submitting…" : "Submit Appeal"}
				</Button>
			</div>
		</>
	);
}
