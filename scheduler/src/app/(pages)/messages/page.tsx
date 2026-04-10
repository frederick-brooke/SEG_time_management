/**
 * Displays the messages page.
 */
import StarBackground from "@/components/StarBackground";

export default function MessagesPage() {
	return (
		<>
			<StarBackground />
			<div className="flex-1 flex items-center justify-center text-center">
				<div className="space-y-1">
					<p className="lunar-header text-xl">
						Select a conversation
					</p>
					<p className="lunar-label-subtitle">
						or search for someone to message
					</p>
				</div>
			</div>
		</>
	);
}
