import QuoteBlock from "components/wellbeing/quote_block";

import TimerController from "components/wellbeing/timer_controller";

export default function WellbeingPage(){
    //timer handling
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
            <div className="w-full max-w-8xl mx-auto p-8 flex flex-col gap-12">

                {/* Page heading */}
                <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-800">
                    Wellbeing Timer
                </h1>

                <p className="text-gray-500 mt-2 max-w-xl mx-auto">
                    Use the timer to stay focused while remembering to take
                    healthy breaks. Set a duration, start your session,
                    and we’ll remind you when it’s time to pause.
                </p>
                </div>

                {/* Quote */}
                <QuoteBlock />

                {/* Timer */}
                <div className="flex justify-center">
                    <TimerController />
                </div>

                {/* Tip */}
                <p className="text-sm text-gray-400 text-center max-w-md mx-auto">
                Tip: Taking short breaks every 30–60 minutes can improve
                concentration, reduce fatigue, and maintain productivity.
                </p>

            </div>
        </div>

    );
}