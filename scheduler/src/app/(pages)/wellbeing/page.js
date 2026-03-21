import QuoteBlock from "components/wellbeing/quote_block";
import TimerController from "components/wellbeing/timer_controller";

export default function WellbeingPage(){
    //timer handling
    return (
        <div className="flex flex-1 flex-col min-h-0 overflow-y-auto p-1 lunar-scroll">
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
                        Use the timer to stay focused while remembering to take healthy breaks. 
                        Set a duration, start your session, and we'll remind you when it's time to pause.
                    </p>
                </div>

                {/* Timer */}
                <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-lg p-8 flex justify-center">
                    <TimerController />
                </div>
            </div>
        </div>

    );
}