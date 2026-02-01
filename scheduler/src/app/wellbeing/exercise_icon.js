"use client";

import { useEffect, useState } from "react";
import styles from "./wellbeing.module.css"

export default function ExerciseIcon() {
    const images = ["/exercise_guide/stretch3.gif", "/exercise_guide/stretch2.jpg", "/exercise_guide/stretch1.jpg", "/exercise_guide/stretch4.gif"];
    const interval = 3000;

    const [imageUsed, setImageUsed] = useState(0);

    useEffect(() => {
        const id = setInterval(() => {
            setImageUsed(i => (i + 1) % images.length);
        }, interval);

        return () => clearInterval(id);
    }, [images.length, interval]);

    return (
        <div className={styles["circle-container"]}>
            <div className={styles["image-wrapper"]}>
                {images.map((src, i) => (
                    <img
                        key={src}
                        src={src}
                        alt=""
                        className={`${styles["exercise-image"]} ${
                            i === imageUsed ? styles["image-active"] : ""
                        }`}
                    />
                ))}
            </div>
        </div>        
    )
};
