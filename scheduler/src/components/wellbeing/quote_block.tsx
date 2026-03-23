"use client";

import { useEffect, useState } from "react";
//frontend view of the quotes
import GlassCard from "@/components/ui/glassCard";

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

  if(error){
    //display the default quote if errorenous
    return (
      <div className="w-full flex justify-center mt-6">
        <GlassCard className="bg-white/5 text-white/80 p-6">
          <p className="text-center italic font-medium">{error}</p>
        </GlassCard>
      </div>
    );
  }
    
  return (
    <div className="w-full flex justify-center mt-6">
      <GlassCard className="min-h-0 flex flex-1 flex-col p-4 overflow-hidden bg-gradient-to-b from-[#0a0a1a] via-[#1a1a3f] to-[#05051a] border-blue-300/30">
        {/* glowing bar from top left corner */}
        <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full bg-blue-400 opacity-10 blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-8 -right-8 w-48 h-48 rounded-full bg-pink-400 opacity-10 blur-3xl animate-pulse-slow" />

        <h3 className="text-sm lunar-label text-blue-200 mb-2 tracking-wide">
          Top Motivational Quote Today
        </h3>

        {loading ? (
          <p className="lunar-page-subtitle text-gray-300 italic text-center">Loading...</p>
        ) : (
          <p className="text-l md:text-lg text-white/90 leading-relaxed font-medium text-center">
            “{quote}”
          </p>
        )}
      </GlassCard>
    </div>
    
  );
}
