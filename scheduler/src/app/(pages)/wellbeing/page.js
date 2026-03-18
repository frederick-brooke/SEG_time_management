import QuoteBlock from "components/wellbeing/quote_block";

import TimerController from "components/wellbeing/timer_controller";

export default function WellbeingPage(){
    //timer handling
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
            <div className="max-w-screen-xl mx-auto px-8 py-10 flex flex-col gap-12">

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
                <div className="bg-white rounded-3xl shadow-lg p-10 flex justify-center">
                    <TimerController />
                </div>
            </div>
        </div>

    );
}