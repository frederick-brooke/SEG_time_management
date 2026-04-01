"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { LunarCard } from "@/components/ui/LunarCard";
import { createPortal } from "react-dom";

/**
 * ReportModal
 *
 * Modal for submitting a report against a user.
 * Handles:
 * - Capturing report reason and additional description
 * - Submitting report data to backend API
 * - Loading state during submission
 * - Success/error feedback and modal closing
 *
 * @param {Object} props
 * @param {string|number} props.reportedUserId - ID of the user being reported
 * @param {string} props.reportedUsername - Username of the reported user (for display)
 * @param {Function} props.onClose - Closes the modal
 *
 * @returns {JSX.Element} Report modal UI
 */
export default function ReportModal({
	reportedUserId,
	reportedUsername,
	onClose,
}) {
	const [reason, setReason] = useState("");
	const [description, setDescription] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleSubmit() {
		setLoading(true);
		const success = await submitReport({
			reportedUserId,
			reason,
			description,
		});
		setLoading(false);

		if (success) {
			alert("Report submitted successfully.");
			onClose();
		}
	}

	return createPortal(
		<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
			<LunarCard className="w-full max-w-md p-6 space-y-5 hover:-translate-y-0">
				<Header username={reportedUsername} onClose={onClose} />

				<InfoText />

				<div className="border-t border-white/10" />

				<ReasonSelect value={reason} onChange={setReason} />

				<DescriptionInput value={description} onChange={setDescription} />

				<ActionButtons
					onClose={onClose}
					onSubmit={handleSubmit}
					disabled={!reason || loading}
					loading={loading}
				/>
			</LunarCard>
		</div>,
		document.body
	);
}

/**
*Submits a report to the API endpoint.
*@param {Object} params - The report submission parameters.
*@param {string} params.reportedUserId - The ID of the user being reported.
*@param {string} params.reason - The reason for the report.
*@param {string} params.description - Additional details about the report.
*@returns {Promise<boolean>} True if submission was successful, false otherwise.
*/
async function submitReport({ reportedUserId, reason, description }) {
	try {
		const res = await fetch("/api/report", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ reportedUserId, reason, description }),
		});

		const data = await res.json();

		if (!res.ok) {
			alert(data.error || "Something went wrong.");
			return false;
		}

		return true;
	} catch (error) {
		console.error(error);
		alert("Failed to submit report");
		return false;
	}
}

/**
*Renders the header section of the report modal with user info and close button.
*@param {Object} props - Component props.
*@param {string} props.username - The username of the user being reported.
*@param {Function} props.onClose - Callback to close the modal.
*@returns {JSX.Element} The header component.
*/
function Header({ username, onClose }) {
	return (
		<div className="flex items-start justify-between">
			<div className="flex items-center gap-3">
				<div className="bg-red-500/15 border border-red-500/25 p-2 rounded-xl">
					<AlertTriangle className="text-red-400 w-5 h-5" />
				</div>
				<div>
					<h2 className="text-xl font-bold text-white lunar-header">
						Report User
					</h2>
					{username && (
						<p className="text-xs text-white/40 mt-0.5">
							Reporting <span className="text-white/70">@{username}</span>
						</p>
					)}
				</div>
			</div>

			<button onClick={onClose}>
				<X className="w-4 h-4" />
			</button>
		</div>
	);
}

/**
*Renders informational text about the reporting process.
*@returns {JSX.Element} The info text component.
*/
function InfoText() {
	return (
		<p className="text-xs text-white/40">
			Reports are reviewed by moderators. Please provide accurate information.
		</p>
	);
}

/**
*Renders a dropdown select for choosing the report reason.
*@param {Object} props - Component props.
*@param {string} props.value - Currently selected reason.
*@param {Function} props.onChange - Callback when reason changes.
*@returns {JSX.Element} The reason select component.
*/
function ReasonSelect({ value, onChange }) {
	return (
		<div>
			<Label className="text-xs text-white/60 uppercase mb-2 block">
				Reason
			</Label>
			<Select
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white"
			>
				<option value="">Select a reason</option>
				<option value="SPAM">Spam</option>
				<option value="HARASSMENT">Harassment</option>
				<option value="INAPPROPRIATE_CONTENT">Inappropriate Content</option>
				<option value="OTHER">Other</option>
			</Select>
		</div>
	);
}

/**
*Renders a textarea for additional report details.
*@param {Object} props - Component props.
*@param {string} props.value - Current description text.
*@param {Function} props.onChange - Callback when description changes.
*@returns {JSX.Element} The description input component.
*/
function DescriptionInput({ value, onChange }) {
	return (
		<div>
			<Label className="text-xs text-white/60 uppercase mb-2 block">
				Additional details
			</Label>
			<textarea
				value={value}
				onChange={(e) => onChange(e.target.value)}
				rows={4}
				className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white"
			/>
		</div>
	);
}

/**
*Renders action buttons for canceling or submitting the report.
*@param {Object} props - Component props.
*@param {Function} props.onClose - Callback to close the modal.
*@param {Function} props.onSubmit - Callback to submit the report.
*@param {boolean} props.disabled - Whether the submit button is disabled.
*@param {boolean} props.loading - Whether the report is being submitted.
*@returns {JSX.Element} The action buttons component.
*/
function ActionButtons({ onClose, onSubmit, disabled, loading }) {
	return (
		<div className="flex justify-end gap-2 pt-1">
			<button
				onClick={onClose}
				className="lunar-page-subtitle px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white/80 text-sm transition-all"
			>
				Cancel
			</button>

			<button
				onClick={onSubmit}
				disabled={disabled}
				className="lunar-page-subtitle px-5 py-2 rounded-full bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm font-bold shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_28px_rgba(239,68,68,0.45)] hover:scale-105 active:scale-95 disabled:opacity-40 disabled:scale-100 disabled:shadow-none transition-all"
			>
				{loading ? "Submitting…" : "Submit Report"}
			</button>
		</div>
	);
}