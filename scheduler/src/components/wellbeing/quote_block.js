"use client";

import { useEffect, useState } from "react";
import styles from "./quote_block.module.css";

//frontend view of the quotes
export default function QuoteBlock() {
  const [quote, setQuote] = useState(); //contents when loading
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/wellbeing/center")    //fetches the backend
      .then((res) => res.json())
      .then((data) => {
        if (data.quote) {
          setQuote(data.quote);   //display the validated quote
        } else {
          setError("You can do this!"); //otherwise if broken then output default
        }
      })
      .catch(() => setError("You can do this!")); //default quote when error
  }, []);

  if (error) return <p>{error}</p>;   //display the default quote if errorenous

  return (
    <quote-block>
      <div className={styles["text"]}>
        <svg className ={styles["corner"]} viewBox="0 0 65 62" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M35 3.5L65 6.5V62L0 0L35 3.5Z" fill="white"/>
        </svg>  
        <p className="text"> "{quote}"</p>
      </div>

    </quote-block>
  );
}
