"use client";

import { useEffect, useRef } from "react";
import styles from "./breath_tracker.module.css"
//Breathing tracker component
export default function BreathTrack() {
    //based on the 4-7-8 breathing technique
    //Breathe through nose for 4s, then hold for 7 and breathe in through mouth for 8s
    const total_time = 19000;   //19 seconds for the total time
    const nose_breathe = 4000; 
    const hold_time = 7000;    

    const containerRef = useRef(null);  //document selectors for the container and text jsx elements
    const textRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;     //sets and points to each element
        const text = textRef.current;

        if(!container || !text) return;     //exit if the containers break

        let cancelled = false;  //control animation cancellation
        const sleep = ms => new Promise(r => setTimeout(r, ms));    //promise-based sleep/delay animation cycle     

        const breathe_animation = async ()=> {
            while(!cancelled){
                text.innerHTML = "Breathe in through nose"; //phase 1
                container.classList.remove(styles.shrink); // remove opposite
                container.classList.add(styles.grow);      // apply grow
                await sleep(nose_breathe);  //wait for the nose breathing duration
            
                text.innerHTML = "Hold";    //phase 2 
                await sleep(hold_time);     //wait for the hold duration
                    
                text.innerHTML = "Breathe in through mouth";    //phase 3
                container.classList.remove(styles.grow);   // remove opposite
                container.classList.add(styles.shrink);    // apply shrink
                await sleep(total_time - nose_breathe - hold_time); //wait for remaining duration
            }            
        };

        breathe_animation();    //initiates the animationj
        return () => {cancelled = true; };  //sets the cancellation flag to stop the animation loop
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




