"use client";

import { useState } from "react";
import { FunnelXIcon } from "lucide-react";
import { Value } from "@radix-ui/react-select";

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
        <form
            onSubmit={handleSubmit}
            className="flex flex-wrap items-center gap-2 mb-6"
        >
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
                className="border rounded px-3 py-2 flex-1 min-w-[200px]"
            />

            <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
                Search
            </button>

            <button
                type="button"
                onClick={onOpenFilter}
                className="bg-blue-500 text-white px-4 py-2 rounded"
            >
                Filter
            </button>

            <button
                type="button"
                onClick={() => {
                    setInputValue("");
                    resetFilters();
                }}
                className="bg-gray-200 px-3 py-2 rounded flex items-center"
            >
                <FunnelXIcon size={16} className="mr-1"/>
                Reset
            </button>
        </form>
    );
}