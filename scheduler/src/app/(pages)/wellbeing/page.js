import QuoteBlock from "components/wellbeing/quote_block";
import BreathTrack from "components/wellbeing/breath_tracker";

import TimerController from "components/wellbeing/timer_controller";

export default function WellbeingPage(){
    //timer handling
    return (
        <>
            <div className="w-full max-w-4xl mx-auto p-8 flex flex-col gap-10">
                <div>
                    <QuoteBlock />
                </div>

                <div className="flex justify-center">
                    <TimerController />
                </div>                
            </div>       
        </>
        
    );
}