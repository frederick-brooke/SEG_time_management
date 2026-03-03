"use client";

import { useEffect, useState } from "react";
//frontend view of the quotes
export default function QuoteBlock() {
  const [quote, setQuote] = useState(); //contents when loading
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

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
      .catch(() => setError("You can do this!")) //default quote when error
      .finally(() => setLoading(false));
    }, []);

  if (error) return <p>{error}</p>;   //display the default quote if errorenous

  return (
    <div className="w-full flex justify-center mt-6">
      <div className="relative max-w-xl w-full bg-white rounded-2xl shadow-md p-6 border">

        {/* acccent Bar */}
        <div className="absolute left-0 top-0 h-full w-1 bg-blue-500 rounded-l-2xl" />

        <h3 className="text-sm font-semibold text-gray-500 mb-3 tracking-wide">
          Top Motivational Quote Today
        </h3>

        {loading ? (
          <p className="text-gray-400 italic">Loading inspiration...</p>
        ) : (
          <p className="text-l text-gray-800 leading-relaxed font-medium">
            “{quote}”
          </p>
        )}
      </div>
    </div>
  );
}
