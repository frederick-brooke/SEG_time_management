import Timer from "../../components/wellbeing/timer";
import QuoteBlock from "../../components/wellbeing/quote_block";
import BreathTrack from "../../components/wellbeing/breath_tracker";
import ViewButtons from "./view_buttons";
import LoadCharacter from "../../components/wellbeing/character_background";
import Reminders from "@/components/wellbeing/timer_reminders";

import styles from "./wellbeing.module.css"

export default function WellbeingPage(){
    return (
        <div className={styles['page-wrapper']}>
            <div className={styles['time-wrapper']}>
                < Timer /> 
                
            </div>

            <div className={styles['center-block']}>
                < QuoteBlock />
                < LoadCharacter />                
            </div>

            <div className={styles['breath-tracker']}>
                < BreathTrack />
            </div>

            <div className={styles['view-buttons']}>
                < ViewButtons />
                < Reminders />
            </div>

            <div className={styles['title']}>
                <h1> For Your Wellbeing and Care </h1>
            </div>

        </div>
    );

}