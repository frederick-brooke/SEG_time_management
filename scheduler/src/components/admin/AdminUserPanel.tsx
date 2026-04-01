import { Button } from "../ui/Button";

/**
 * Displays detailed information about a selected user.
 *
 * Features:
 * - Shows user profile information
 * - Indicates current status (Active / Banned)
 * - Allows closing the panel view
 * Behavior: Returns null if no user is selected (prevents unnecessary rendering)
 *
 * @param {Object} props - Component props
 * @param {Object|null} props.user - Selected user object
 * @param {Function} props.onClose - Function to close the panel
 * @returns {JSX.Element|null} User panel UI or null if no user
 */
export default function UserPanel({ user, onClose }) {
	if (!user) return null; 	// Do not render if no user is selected

	return (
		<div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm" onClick={onClose}>
			<div className="h-full w-96 flex flex-col bg-white/5 backdrop-blur-xl border-l border-white/10 shadow-2xl" onClick={(e) => e.stopPropagation()}>
				<Header onClose={onClose} />

				<Content user={user} />

				<Footer onClose={onClose} />
			</div>
		</div>
	);
}

/**
*Renders the header section of the user panel with title and close button.
*@param {Function} props.onClose - Callback to close the panel.
*@returns {JSX.Element} The header component.
*/
function Header({ onClose }) {
	return (
		<div className="p-6 flex items-center justify-between border-b border-white/10">
			<h3 className="lunar-header text-lg font-semibold text-white">
				User Details
			</h3>
			<Button
				onClick={onClose}
				className="text-white/50 hover:text-white transition"
			>
				✕
			</Button>
		</div>
	);
}

/**
*Renders the main content area of the user panel with profile and activity stats.
*@param {Object} props.user - The user data object.
*@returns {JSX.Element} The content component.
*/
function Content({ user }) {
	return (
		<div className="p-6 space-y-6 overflow-y-auto">
			<Profile user={user} />
			<ActivityStats user={user} />
		</div>
	);
}

/**
*Renders the user profile section with avatar, username, email, and status badge.
*@param {Object} props.user - The user data object.
*@returns {JSX.Element} The profile component.
*/
function Profile({ user }) {
	const status = user.isBanned ? "Banned" : "Active";

	return (
		<div className="flex items-center gap-4">
			<Avatar user={user} />

			<div>
				<h4 className="text-lg font-semibold text-white">
					{user.username}
				</h4>
				<p className="text-sm text-white/50">{user.email}</p>

				<StatusBadge status={status} isBanned={user.isBanned} />
			</div>
		</div>
	);
}

/**
*Renders the user avatar image or initials fallback.
*@param {Object} props.user - The user data object.
*@returns {JSX.Element} The avatar component.
*/
function Avatar({ user }) {
	return (
		<div className="lunar-page-subtitle w-20 h-20 rounded-full overflow-hidden bg-white/10 flex items-center justify-center text-white font-semibold">
			{user.pfp ? (
				<img
					src={user.pfp}
					alt="Profile"
					className="w-full h-full object-cover"
				/>
			) : (
				<span>
					{user.fname?.[0] ?? user.username?.[0] ?? ""}
					{user.lname?.[0] ?? ""}
				</span>
			)}
		</div>
	);
}

/**
*Renders a status badge indicating whether the user is banned or active.
*@param {string} props.status - The status text to display.
*@param {boolean} props.isBanned - Whether the user is banned.
*@returns {JSX.Element} The status badge component.
*/
function StatusBadge({ status, isBanned }) {
	return (
		<span
			className={`inline-block mt-2 px-2 py-1 text-xs rounded-lg ${
				isBanned
					? "bg-red-400/20 text-red-300"
					: "bg-green-400/20 text-green-300"
			}`}
		>
			{status}
		</span>
	);
}

/**
*Renders user activity statistics including reports and appeals counts.
*@param {Object} props.user - The user data object with _count relations.
*@returns {JSX.Element} The activity stats component.
*/
function ActivityStats({ user }) {
	const stats = [
		{ label: "Reports Made", value: user._count?.reportsMade ?? 0 },
		{ label: "Reports Received", value: user._count?.reportsReceived ?? 0 },
		{ label: "Appeals", value: user._count?.appeals ?? 0 },
		{
			label: "Created",
			value: new Date(user.createdAt).toLocaleDateString(),
		},
	];

	return (
		<div>
			<p className="lunar-page-subtitle text-xs uppercase text-white/40 tracking-wider mb-3">
				Activity
			</p>

			<div className="grid grid-cols-2 gap-3">
				{stats.map((item) => (
					<StatCard key={item.label} {...item} />
				))}
			</div>
		</div>
	);
}

/**
*Renders a single statistics card with label and value.
*@param {string} props.label - The label text.
*@param {string|number} props.value - The value to display.
*@returns {JSX.Element} The stat card component.
*/
function StatCard({ label, value }) {
	return (
		<div className="p-3 rounded-xl bg-white/5 border border-white/10">
			<p className="text-sm font-semibold text-white">{value}</p>
			<p className="text-xs text-white/40">{label}</p>
		</div>
	);
}

/**
*Renders the footer section of the user panel with close button.
*@param {Function} props.onClose - Callback to close the panel.
*@returns {JSX.Element} The footer component.
*/
function Footer({ onClose }) {
	return (
		<div className="lunar-page-subtitle p-6 border-white/10 border-t mt-auto">
			<Button
				onClick={onClose}
				className="w-full py-2 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 transition"
			>
				Close
			</Button>
		</div>
	);
}