"use client";

import { useState } from "react";
import { FunnelXIcon } from "lucide-react";

//UI components
import GlassCard from "@/components/ui/glassCard";

export default function SearchControls({
    filters,
    setFilters,
    resetFilters,
    onOpenFilter,
    placeholder = "Search..."
}) {

    const [inputValue, setInputValue] = useState(filters.search ?? "");

    function handleSubmit(e){
        e.preventDefault();

        setFilters(prev => ({
            ...prev,
            search: inputValue,
            page: 1
        }));
    }

    return (
        <GlassCard className="p-4 flex flex-wrap items-center gap-2 bg-gradient-to-r from-[#0a0a1a] via-[#1a1a3f] to-[#05051a] border-blue-300/30">
            <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2 w-full">
                <input
                    type="text"
                    placeholder={placeholder}
                    value={inputValue}
                    onChange={(e) => {
                        const value = e.target.value;
                        setInputValue(value);

                        setFilters(prev => ({
                        ...prev,
                        search: value,
                        page: 1,
                        }));
                    }}
                    className="flex-1 min-w-[200px] px-3 py-2 rounded-xl bg-white/5 border border-white/10 placeholder:text-white/40 text-white focus:outline-none focus:ring-1 focus:ring-blue-300/50 transition"
                />

                <button type="submit" className="px-4 py-2 rounded-xl bg-blue-400 text-gray-950 font-semibold hover:scale-105 transition">
                    Search
                </button>

                <button type="button" onClick={onOpenFilter} className="px-4 py-2 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 transition">
                    Filter
                </button>

                <button type="button"
                    onClick={() => {
                        setInputValue("");
                        resetFilters();
                    }}
                    className="px-3 py-2 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 flex items-center gap-1 transition"
                >
                    <FunnelXIcon size={16} />
                    Reset
                </button>
            </form>
        </GlassCard>
    );
}