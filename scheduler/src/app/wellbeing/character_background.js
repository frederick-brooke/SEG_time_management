"use client";
import {useEffect} from "react";
import styles from "./character.module.css"

export default function LoadCharacter() {
    //temporary placeholder code until characters are fully designed
    const character_img = "/character_example.png";

    return (
        <div className={styles["character-container"]}>
            <div className={styles["character-image"]}>
                <img src= {character_img} alt=""></img>
            </div>
        </div>        
    );
};