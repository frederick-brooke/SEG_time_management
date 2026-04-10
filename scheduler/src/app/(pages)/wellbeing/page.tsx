import QuoteBlock from "@/components/wellbeing/QuoteBlock";
import TimerController from "@/components/wellbeing/TimerController";
import StarBackground from "@/components/StarBackground";

/**
 * WellbeingPage Component
 *
 * Provides a focused wellbeing interface featuring:
 * - A motivational quote
 * - A timer to encourage productive work sessions
 * - Guidance text promoting healthy breaks
 *
 * @returns {JSX.Element} The wellbeing page layout with quote and timer.
 */
export default function WellbeingPage() {
	// Timer handling is managed internally by TimerController
	return (
		<div className="flex flex-1 flex-col min-h-0 overflow-y-auto p-1 lunar-scroll">
			<StarBackground />
			{/* Container */}
			<div className="flex flex-1 flex-col gap-6 w-full max-w-full">
				{/* Quote */}
				<QuoteBlock />

				{/* Page heading */}
				<div className="text-center px-4">
					<h1 className="lunar-label text-l md:text-2xl font-bold text-white">
						Wellbeing Timer
					</h1>

					<p className="lunar-page-subtitle text-white-800 mt-2 mx-auto">
						Use the timer to stay focused while remembering to take
						healthy breaks. Set a duration, start your session, and
						we'll remind you when it's time to pause.
					</p>
				</div>

				{/* Timer controller container */}
				<div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-lg p-8 flex justify-center">
					<TimerController />
				</div>
			</div>
		</div>
	);
}
