import { AlertTriangle, ShieldOff, X } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/Button";

/**
 * BanInfo
 *
 * Displays details about the user's ban including:
 * - Reason
 * - Expiration (or permanent status)
 * - Actions (appeal / sign out)
 *
 * @param {Object} props
 * @param {Object} props.BanInfo - Ban data from backend
 * @param {Function} props.onAppeal - Opens appeal form
 */
export default function BanInfo({ banInfo, onAppeal }) {
	const isPermanent = !banInfo.expires;

	return (
		<>
			<div className="flex items-center gap-3">
				<div className="bg-red-500/15 border border-red-500/25 p-2.5 rounded-xl">
					<ShieldOff className="text-red-400 w-5 h-5" />
				</div>
				<div>
					<h1 className="lunar-header text-lg font-black text-white">
						Account Banned
					</h1>
					<p className="lunar-page-subtitle text-xs text-white/40">
						Your access has been restricted
					</p>
				</div>
			</div>

			<div className="border-t border-white/10" />

			<BanDetails banInfo={banInfo} isPermanent={isPermanent} />

			<WarningNote />

			<ActionButtons onAppeal={onAppeal} />
		</>
	);
}

/**
 *Renders ban details including reason and expiration information.
 *@param {Object} props.BanInfo - The ban information object.
 *@param {string} props.BanInfo.reason - The reason for the ban.
 *@param {string} props.BanInfo.expires - The expiration date of the ban.
 *@param {boolean} props.isPermanent - Whether the ban is permanent.
 *@returns {JSX.Element} The ban details component.
 */
function BanDetails({ banInfo, isPermanent }) {
	return (
		<div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
			<div>
				<p className="text-[10px] text-white/30 uppercase mb-1">
					Reason
				</p>
				<p className="text-sm text-white/80">{banInfo.reason}</p>
			</div>

			<div className="border-t border-white/10" />

			<div>
				<p className="text-[10px] text-white/30 uppercase mb-1">
					Ban Expires
				</p>
				<p
					className={`text-sm font-semibold ${isPermanent ? "text-red-400" : "text-amber-400"}`}
				>
					{isPermanent
						? "Permanent"
						: new Date(banInfo.expires).toLocaleString()}
				</p>
			</div>
		</div>
	);
}

/**
 *Renders a warning note advising users to submit an appeal if the ban was issued in error.
 *@returns {JSX.Element} The warning note component.
 */
function WarningNote() {
	return (
		<div className="flex items-start gap-2 px-1">
			<AlertTriangle className="text-amber-400/60 w-3.5 h-3.5 mt-0.5" />
			<p className="text-xs text-white/30">
				If you believe this ban was issued in error, you can submit an
				appeal below.
			</p>
		</div>
	);
}

/**
 *Renders action buttons for submitting an appeal and signing out.
 *@param {Object} props - Component props.
 *@param {Function} props.onAppeal - Callback when appeal button is clicked.
 *@returns {JSX.Element} The action buttons component.
 */
function ActionButtons({ onAppeal }) {
	return (
		<div className="flex flex-col gap-2 pt-1">
			<Button
				onClick={onAppeal}
				className="lunar-page-subtitle w-full py-2.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-bold"
			>
				Submit Appeal
			</Button>

			<Button
				onClick={() => signOut({ callbackUrl: "/login" })}
				className="w-full px-6 py-3 rounded-2xl bg-white/5 ring-1 ring-white/10 text-white/80 font-medium hover:bg-white/10 transition"
			>
				Sign Out
			</Button>
		</div>
	);
}
