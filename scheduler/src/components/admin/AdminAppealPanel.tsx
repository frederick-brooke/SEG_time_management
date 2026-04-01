"use client"
import { useState, useCallback } from "react";

/**
 * Displays detailed information about a selected appeal
 * and allows moderators to approve or reject it.
 *
 * Features:
 * - Shows appeal metadata (user, report, status, timestamps)
 * - Displays appeal description and optional moderator notes
 * - Allows SUPERUSER actions (approve / reject)
 * - Handles async actions with loading state
 *
 * @param {Object} props - Component props
 * @param {Object|null} props.appeal - Selected appeal object
 * @param {Function} props.onClose - Closes the panel
 * @param {Function} props.fetchAppeals - Refetches appeal list after action
 *
 * @returns {JSX.Element|null} Side panel UI or null if no appeal selected
 */
export default function AppealPanel({appeal, onClose,fetchAppeals,}) {
	if (!appeal) return null;
	const [loading, setLoading] = useState(false);

	const handleAction = useCallback(async (action) => {
		setLoading(true);
		try {
			await fetch(`/api/admin/appeals/${appeal.id}`, {	// Send PATCH request to update appeal status
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action }),
			});
			fetchAppeals();		// Refresh appeal list and close panel
			onClose();
		} finally {
			setLoading(false);
		}
	}, [appeal.id, fetchAppeals, onClose]);

	return (
		<div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm" onClick={onClose}>
			<div className="h-full w-96 flex flex-col bg-white/5 backdrop-blur-xl border-l border-white/10 shadow-2xl" onClick={(e) => e.stopPropagation()}>

				{/* Header */}
				<div className="p-6 border-b border-white/10 flex items-center justify-between">
					<h3 className="lunar-header text-lg font-semibold text-white">
						Appeal Details
					</h3>
					<button
						onClick={onClose}
						className="text-white/50 hover:text-white transition"
					>
						✕
					</button>
				</div>

				{/* Content */}
				<div className="p-6 space-y-6 overflow-y-auto flex-1">
					{/* Info */}
					<AppealInfo appeal={appeal} />

					{/* Status */}
					<div className="flex justify-between items-center">
						<span className="text-xs uppercase text-white/40 tracking-wider">
							Status
						</span>
						<StatusBadge status={appeal.status} />
					</div>

					{/* Description */}
					<div className="space-y-1">
						<p className="lunar-page-subtitle text-xs text-white/40 uppercase tracking-wider">
							Appeal Message
						</p>
						<div className="bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white/80">
							{appeal.message || "No message provided"}
						</div>
					</div>

					{/* Actions */}
					<AppealActions
						status={appeal.status}
						loading={loading}
						onApprove={() => handleAction("APPROVE")}
						onReject={() => handleAction("REJECT")}
					/>
				</div>

				{/* Footer */}
				<div className="p-6 border-t border-white/10">
					<button
						onClick={onClose}
						className="lunar-page-subtitle w-full py-2 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 transition"
					>
						Close
					</button>
				</div>
			</div>
		</div>
	);
}

function InfoRow({ label, value }) {
	return (
		<div className="flex justify-between">
			<span className="text-xs uppercase text-white/40 tracking-wider">
				{label}
			</span>
			<span className="font-medium text-white">{value}</span>
		</div>
	);
}

function getStatusStyles(status) {
	switch (status) {
		case "APPROVED":
			return "bg-green-400/20 text-green-300";
		case "REJECTED":
			return "bg-red-400/20 text-red-300";
		default:
			return "bg-yellow-400/20 text-yellow-300";
	}
}

function AppealActions({ status, onApprove, onReject, loading }) {
	if (status !== "PENDING") return null;

	return (
		<div className="space-y-2">
			<button
				onClick={onApprove}
				disabled={loading}
				className="w-full py-2 rounded-xl bg-green-400 text-gray-900 font-medium"
			>
				Approve Appeal & Lift Ban
			</button>

			<button
				onClick={onReject}
				disabled={loading}
				className="w-full py-2 rounded-xl bg-red-400 text-gray-900 font-medium"
			>
				Reject Appeal
			</button>
		</div>
	);
}

function AppealInfo({ appeal }) {
	return (
		<div className="space-y-3">
			<InfoRow label="Appeal ID" value={appeal.id} />
			<InfoRow
				label="Appealing User"
				value={appeal.user?.username ?? appeal.user?.email}
			/>
			<InfoRow
				label="Submitted"
				value={new Date(appeal.createdAt).toLocaleString()}
			/>
			<InfoRow
				label="Related Report"
				value={appeal.report?.id ?? "Unknown"}
			/>
			<InfoRow
				label="Handled By"
				value={appeal.handledBy?.username ?? "Not handled yet"}
			/>
		</div>
	);
}

function StatusBadge({ status }) {
	return (
		<span
			className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusStyles(
				status
			)}`}
		>
			{status}
		</span>
	);
}