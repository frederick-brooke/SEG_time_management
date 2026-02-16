"use client";

import { useEffect, useRef } from "react";
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
                container.classList.remove("scale-100"); // remove opposite
                container.classList.add("scale-125");      // apply grow
                await sleep(nose_breathe);  //wait for the nose breathing duration
            
                text.innerHTML = "Hold";    //phase 2 
                await sleep(hold_time);     //wait for the hold duration
                    
                text.innerHTML = "Breathe in through mouth";    //phase 3
                container.classList.remove("scale-125");   // remove opposite
                container.classList.add("scale-100");    // apply shrink
                await sleep(total_time - nose_breathe - hold_time); //wait for remaining duration
            }            
        };

        breathe_animation();    //initiates the animationj
        return () => {cancelled = true; };  //sets the cancellation flag to stop the animation loop
    }, []);   

    return(
        <div className="relative left-[30%] top-[10%]">
            <div
                ref={containerRef}
                className="relative h-[120px] w-[120px] transform transition-transform duration-[4000ms] scale-100"
            >
                {/* Outer Gradient Ring */}
                <div
                    className="absolute border-2 border-black shadow-lg top-1/2 left-1/2 h-[130px] w-[130px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{
                        background:
                        "conic-gradient(#55b7a4 0%, #56a595 21%, #ffffff 21%, #ffffff 58%, #0f3830 58%, #1f5046 100%)",
                    }}
                />

                {/* Inner Circle */}
                <div className="absolute inset-0 rounded-full bg-[#7cabd7]" />

                {/* Text */}
                <p
                ref={textRef}
                className="absolute inset-0 flex items-center justify-center text-white text-xs text-center z-10 pointer-events-none"
                />

                {/* Rotating Pointer */}
                <div className="absolute top-1/2 left-1/2 h-0 w-0 origin-bottom animate-spin [animation-duration:19s]">
                <div className="absolute left-1/2 top-0 h-[8px] w-[8px] -translate-x-1/2 -translate-y-1/2 -translate-y-[60px] rounded-full bg-white" />
                </div>
            </div>
        </div>           
    )
}




