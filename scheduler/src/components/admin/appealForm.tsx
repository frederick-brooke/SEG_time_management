import { useEffect, useState } from "react";
import { AlertTriangle, ShieldOff, X } from "lucide-react";

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
				<h2 className="lunar-header text-lg text-white">Submit Appeal</h2>
				<button onClick={onClose}><X /></button>
			</div>

			<textarea
				value={description}
				onChange={(e) => setDescription(e.target.value)}
				className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-2"
			/>

			<div className="flex justify-end gap-2">
				<button onClick={onClose}>Cancel</button>
				<button onClick={handleSubmit} disabled={!description || loading}>
					{loading ? "Submitting…" : "Submit Appeal"}
				</button>
			</div>
		</>
	);
}