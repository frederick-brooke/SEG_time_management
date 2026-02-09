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
    <div className={styles["quote-wrapper"]}>
      <div className={styles["text"]}>
        <p> <b>Top Motivational Quotes Today:</b> "{quote}"</p>
      </div>
    </div>
  );
}
