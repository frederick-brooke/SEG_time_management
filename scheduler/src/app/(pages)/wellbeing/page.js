import QuoteBlock from "components/wellbeing/quote_block";
import BreathTrack from "components/wellbeing/breath_tracker";

import TimerController from "components/wellbeing/timer_controller";

import styles from "./wellbeing.module.css"

export default function WellbeingPage(){
    //timer handling
    return (
        <div className={styles["page-wrapper"]}>
            <div >
                <TimerController />
            </div>

            <div>
                <QuoteBlock />
            </div>

            <div >
                <BreathTrack />
            </div>
        </div>
    );
}