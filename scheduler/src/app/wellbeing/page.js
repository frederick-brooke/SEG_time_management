import Timer from "./timer";
import QuoteBlock from "./quote_block";
import BreathTrack from "./breath_tracker";
import ViewButtons from "./view_buttons";
import ExerciseIcon from "./exercise_icon";
import LoadCharacter from "./character_background";

import styles from "./wellbeing.module.css"
import CurvedLabel from "./curved_label";

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
            </div>

            <div className={styles['exercise-icon']}>
                    <  ExerciseIcon />

            </div>

            <div className={styles['title']}>
                <h1> For Your Wellbeing and Care </h1>
            </div>

        </div>
    );

}