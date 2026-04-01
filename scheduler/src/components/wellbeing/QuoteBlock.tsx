"use client";

import { useEffect, useState } from "react";
//frontend view of the quotes
import GlassCard from "@/components/ui/GlassCard";

const defaultQuote = "You can do this!";

/**
 * QuoteBlock
 *
 * Displays a motivational quote fetched from the backend.
 * Handles:
 * - Fetching quote data from API on mount
 * - Loading state while fetching
 * - Fallback quote on error or invalid response
 * - Styled presentation using GlassCard UI
 *
 * @returns {JSX.Element} Quote display block
 */
export default function QuoteBlock() {
    const [quote, setQuote] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            try {
                const result = await fetchQuote();
                if (!mounted) return;
                setQuote(result);
            } catch {
                if (!mounted) return;
                setQuote(defaultQuote);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        load();
        return () => { mounted = false; };
    }, []);

    if (!loading && quote === defaultQuote) {
        return (
            <div className="w-full flex justify-center mt-6">
                <GlassCard className="bg-white/5 text-white/80 p-6">
                    <p className="text-center italic font-medium">{quote}</p>
                </GlassCard>
            </div>
        );
    }

    return (
        <div className="w-full flex justify-center mt-6">
            <GlassCard className="min-h-0 flex flex-1 flex-col p-4 overflow-hidden bg-gradient-to-b from-[#0a0a1a] via-[#1a1a3f] to-[#05051a] border-blue-300/30">
                <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full bg-blue-400 opacity-10 blur-3xl animate-pulse-slow" />
                <div className="absolute -bottom-8 -right-8 w-48 h-48 rounded-full bg-pink-400 opacity-10 blur-3xl animate-pulse-slow" />

                <h3 className="text-sm lunar-label text-blue-200 mb-2 tracking-wide">
                    Top Motivational Quote Today
                </h3>

                {loading ? (
                    <p className="lunar-page-subtitle text-gray-300 italic text-center">
                        Loading...
                    </p>
                ) : (
                    <p className="text-l md:text-lg text-white/90 leading-relaxed font-medium text-center">
                        “{quote}”
                    </p>
                )}
            </GlassCard>
        </div>
    );
}

/**
 * Fetches quote from API.
 *
 * @returns {Promise<string>}
 */
async function fetchQuote(): Promise<string> {
    const res = await fetch("/api/wellbeing/center");
    if (!res.ok) return defaultQuote;

    const data = await res.json();
    return data?.quote || defaultQuote;
}
