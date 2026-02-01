"use client";

import { useEffect, useRef } from "react";
import styles from "./wellbeing.module.css"

export default function BreathTrack() {
    const total_time = 19000;
    const nose_breathe = 4000;
    const hold_time = 7000;    

    const containerRef = useRef(null);
    const textRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        const text = textRef.current;

        if(!container || !text) return;

        let cancelled = false;
        const sleep = ms => new Promise(r => setTimeout(r, ms));        

        const breathe_animation = async ()=> {
            while(!cancelled){
                text.innerHTML = "Breathe in through nose";
                container.classList.remove(styles.shrink); // remove opposite
                container.classList.add(styles.grow);      // apply grow
                await sleep(nose_breathe);
            
                text.innerHTML = "Hold";
                await sleep(hold_time);
                    
                text.innerHTML = "Breathe in through mouth";
                container.classList.remove(styles.grow);   // remove opposite
                container.classList.add(styles.shrink);    // apply shrink
                await sleep(total_time - nose_breathe - hold_time);
            }            
        };

        breathe_animation();
        return () => {cancelled = true; };
    }, []);   

    return(
            <div ref={containerRef} className={styles['breath-container']}>
                
                    <div className={styles["circle"]}/>

                    <p ref={textRef} className={styles["text"]}> </p>

                    <div className={styles["pointer-container"]}>
                        <div className={styles["pointer"]}/>
                    </div>
                    
                    <div className={styles['gradient-circle']}/>                 
            </div>
    )
}




