import { useState } from "react";

/**
 * Displays detailed information about a selected report and allows moderators to take action
 *
 * Features:Shows report metadata (users, status, timestamps), displays report description, allows moderator actions via modal
 * @param {Object|null} props.report - Selected report object
 * @param {Function} props.onClose - Closes the panel
 * @param {Function} props.fetchReports - Refetches reports after actions
 * @returns {JSX.Element|null} Report panel UI or null if no report
 */
export default function ReportPanel({ report, onClose, fetchReports }) {
	if (!report) return null;

	const [showReportAction, setShowReportAction] = useState(false);

	async function handleBan(user, type, durationDays = null) {
		if (!user?.id) {
			alert("Cannot ban user: user ID is missing.");
			return;
		}

		await fetch(`/api/admin/users/${user.id}/ban`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ type, durationDays, reportId: report.id }),
		});

		showBanAlert(user.username, type);
		fetchReports();
	}

	return (
		<div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm" onClick={onClose}>
			<div className="h-full w-96 flex flex-col bg-white/5 backdrop-blur-xl border-l border-white/10 shadow-2xl" onClick={(e) => e.stopPropagation()}>
				<Header onClose={onClose} />

				<Content report={report} onTakeAction={() => setShowReportAction(true)} />

				<Footer onClose={onClose} />
			</div>

			{showReportAction && (
				<ReportActionModal report={report} onClose={() => setShowReportAction(false)} banUser={handleBan} />
			)}
		</div>
	);
}

/**
*Displays an alert with ban/unban status for a user.
*@param {string} username - The username of the affected user.
*@param {string} type - The action type: "TEMP", "PERMANENT", or any other for unban.
*/
function showBanAlert(username, type) {
	if (type === "TEMP") {
		alert(`User ${username} Temporarily Banned`);
	} else if (type === "PERMANENT") {
		alert(`User ${username} Permanently Banned`);
	} else {
		alert(`User ${username} Unbanned`);
	}
}

/**
*Returns CSS classes for status badge styling based on report status.
*@param {string} status - The report status: "RESOLVED", "REJECTED", or other.
*@returns {string} The CSS class names for the status badge.
*/
function getStatusStyles(status) {
	switch (status) {
		case "RESOLVED": return "bg-green-400/20 text-green-300";
		case "REJECTED": return "bg-red-400/20 text-red-300";
		default: return "bg-yellow-400/20 text-yellow-300";
	}
}

/**
*Renders the header section of the report panel with title and close button.
*@param {Function} props.onClose - Callback to close the panel.
*@returns {JSX.Element} The header component.
*/
function Header({ onClose }) {
	return (
		<div className="p-6 border-b border-white/10 flex items-center justify-between">
			<h3 className="lunar-header text-lg font-semibold text-white">
				Report Details
			</h3>
			<button onClick={onClose} className="text-white/50 hover:text-white transition" >
				✕
			</button>
		</div>
	);
}

/**
*Renders the main content area of the report panel.
*@param {Object} props.report - The report data object.
*@param {Function} props.onTakeAction - Callback when take action button is clicked.
*@returns {JSX.Element} The content component.
*/
function Content({ report, onTakeAction }) {
	return (
		<div className="p-6 space-y-6 overflow-y-auto flex-1">
			<ReportInfo report={report} />
			<Description text={report.description} />
			{!report.handledBy && ( <ActionButton onClick={onTakeAction} /> )}
		</div>
	);
}

/**
*Renders the footer section of the report panel with close button.
*@param {Function} props.onClose - Callback to close the panel.
*@returns {JSX.Element} The footer component.
*/
function Footer({ onClose }) {
	return (
		<div className="p-6 border-t border-white/10">
			<button onClick={onClose} className="lunar-page-subtitle w-full py-2 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 transition">
				Close
			</button>
		</div>
	);
}

/**
*Renders a label-value pair row for report information.
*@param {string} props.label - The label text.
*@param {string|number} props.value - The value to display.
*@returns {JSX.Element} The info row component.
*/
function InfoRow({ label, value }) {
	return (
		<div className="flex justify-between">
			<span className="text-xs uppercase text-white/40 tracking-wider"> {label} </span>
			<span className="font-medium text-white">{value}</span>
		</div>
	);
}

/**
*Renders a status badge with appropriate styling.
*@param {string} props.status - The status text to display.
*@returns {JSX.Element} The status badge component.
*/
function StatusBadge({ status }) {
	return (
		<span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusStyles( status )}`} > {status}	</span>
	);
}

/**
Renders all report information including ID, users, status, and ban expiry.
*@param {Object} props.report - The report data object.
*@returns {JSX.Element} The report info component.
*/
function ReportInfo({ report }) {
	return (
		<div className="space-y-3">
			<InfoRow label="Report ID" value={report.id} />
			<InfoRow label="Reported User" value={report.reportedUser.username} />
			<InfoRow label="Reported By" value={report.reportedBy.username} />

			<div className="flex justify-between items-center">
				<span className="text-xs uppercase text-white/40 tracking-wider">	Status	</span>
				<StatusBadge status={report.status} />
			</div>

			<InfoRow label="Handled By" value={report.handledBy?.username ?? "Not handled yet"} />
			{report.status === "RESOLVED" && report.reportedUser.isBanned && (	<InfoRow label="Ban Expires" value={ report.reportedUser.banExpires ? new Date( report.reportedUser.banExpires ).toLocaleString() : "Permanent"}/> )}
		</div>
	);
}

/**
*Renders the report description section.
*@param {string} props.text - The description text to display.
*@returns {JSX.Element} The description component.
*/
function Description({ text }) {
	return (
		<div className="space-y-1">
			<p className="lunar-page-subtitle text-xs text-white/40 uppercase tracking-wider">
				Description
			</p>
			<div className="bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white/80">
				{text}
			</div>
		</div>
	);
}

/**
*Renders a button to take action on the report.
*@param {Function} props.onClick - Callback when button is clicked.
*@returns {JSX.Element} The action button component.
*/
function ActionButton({ onClick }) {
	return (
		<button onClick={onClick} className="lunar-page-subtitle w-full py-2 rounded-xl bg-blue-400 text-gray-900 font-medium hover:scale-[1.02] transition">
			Take Action
		</button>
	);
}

/**
 * Modal for performing moderation actions on a reported user. *
 * @param {Object} props
 * @param {Object} props.report - Report object
 * @param {Function} props.onClose - Closes modal
 * @param {Function} props.banUser - Moderation handler
 * @returns {JSX.Element} Modal UI
 */
function ReportActionModal( {report, onClose, banUser} ) {
    return(
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white/5 w-full max-w-md p-6 space-y-4 rounded-xl shadow-2xl backdrop-blur-xl border border-white/10" onClick={(e) => e.stopPropagation()}>
                <h2 className="lunar-header text-lg font-semibold text-white">Report Action</h2>

				{/* Optional moderator reasoning input */}
                <textarea placeholder="Reasoning (Optional)" className="w-full bg-white/5 border border-white/10 text-white/80 rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"/>
				{/* Action buttons */}
                <div className="space-y-2">
                    <button onClick={() => banUser(report.reportedUser, "TEMP", 7)} className="w-full py-2 rounded-xl bg-yellow-400 text-gray-900 font-medium hover:scale-[1.02] transition">
                        Temporary Ban (7 days)
                    </button>
                    <button onClick={() => banUser(report.reportedUser, "PERMANENT")} className="w-full py-2 rounded-xl bg-red-400 text-gray-900 font-medium hover:scale-[1.02] transition" disabled={!report.reportedUser?.id}>
                        Permanent Ban
                    </button>
                    <button onClick={() => banUser(report.reportedUser, "UNBAN")} className="w-full py-2 rounded-xl bg-green-400 text-gray-900 font-medium hover:scale-[1.02] transition">
                        Unban
                    </button>
                </div>
                <button onClick={onClose} className="lunar-page-subtitle w-full py-2 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 transition">
                    Cancel
                </button>
            </div>
        </div>
    );
}