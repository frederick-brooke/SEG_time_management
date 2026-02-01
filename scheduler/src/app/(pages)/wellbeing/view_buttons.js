"use client";

import { useState, useEffect } from "react";
import styles from "./wellbeing.module.css";

export default function ViewButtons () {
    const colours = ["background-main", "background-green", "background-yellow", "background-red", "background-dim"];
    const [index, setIndex] = useState(0);

    const [isDimmed, setIsDimmed] = useState(false);

    useEffect(() => {
        document.body.className = "";

        document.body.classList.add(isDimmed ? "background-dim" : colours[index]);
    }, [index, isDimmed]);

    return (
        <div className = {styles["button-list"]}>
            
            <div className = {styles["view-button"]}>
                <button onClick={() => setIndex((index+1) % colours.length)}>
                    Change Colour
                </button>
            </div>    

            <div className = {styles["view-button"]}>
                {!isDimmed && 
                    <button onClick={() => setIsDimmed(true)}>
                        Dim Light
                    </button>
                }

                {isDimmed && 
                    <button onClick={() => setIsDimmed(false)}>
                        Restore Light
                    </button>
                }
            </div>              
        </div>
    );
}

function DimBackground() {
    useEffect(() => {
        document.body.className = "";

        document.body.classList.add("background-dim");
    }, [index]);
}