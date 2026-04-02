"use client";
import { useState } from "react";
import { FunnelXIcon } from "lucide-react";
//UI components
import GlassCard from "@/components/ui/GlassCard";

/**
 * SearchControls
 *
 * Reusable search and filter control bar.
 * Handles:
 * - Search input (controlled + synced with filters)
 * - Submitting search queries
 * - Opening filter panel
 * - Resetting filters and input state
 *
 * @param {Object} props
 * @param {Object} props.filters - Current filter state
 * @param {Function} props.setFilters - State setter for filters
 * @param {Function} props.resetFilters - Resets all filters
 * @param {Function} props.onOpenFilter - Opens filter panel
 * @param {string} [props.placeholder] - Input placeholder text
 *
 * @returns {JSX.Element} Search control UI
 */
export default function SearchControls({ filters, setFilters, resetFilters, onOpenFilter, placeholder = "Search..."}) {
    const [inputValue, setInputValue] = useState(filters.search ?? "");

	function handleSubmit(e) {
		e.preventDefault();
		updateFilters(inputValue, setFilters);
	}

	function handleChange(e) {
		const value = e.target.value;
		setInputValue(value);
		updateFilters(value, setFilters);
	}

	function handleReset() {
		setInputValue("");
		resetFilters();
	}

	return (
		<GlassCard className="p-4 flex flex-wrap items-center gap-2 bg-gradient-to-r from-[#0a0a1a] via-[#1a1a3f] to-[#05051a] border-blue-300/30">
			<form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2 w-full">
				<SearchInput value={inputValue} onChange={handleChange} placeholder={placeholder}/>

				<SearchButton />

				<FilterButton onClick={onOpenFilter} />

				<ResetButton onClick={handleReset} />
			</form>
		</GlassCard>
	);
}

/**
*Updates filter state with search value and resets to page 1.
*@param {string} value - The search input value.
*@param {Function} setFilters - State setter function for filters.
*/
function updateFilters(value, setFilters) {
	setFilters((prev) => ({
		...prev,
		search: value,
		page: 1,
	}));
}

/**
*Renders a search input field.
*@param {Object} props - Component props.
*@param {string} props.value - Current input value.
*@param {Function} props.onChange - Callback when input value changes.
*@param {string} props.placeholder - Placeholder text for the input.
*@returns {JSX.Element} The search input component.
*/
function SearchInput({ value, onChange, placeholder }) {
	return (
		<input
			type="text"
			placeholder={placeholder}
			value={value}
			onChange={onChange}
			className="flex-1 min-w-[200px] px-3 py-2 rounded-xl bg-white/5 border border-white/10 placeholder:text-white/40 text-white focus:outline-none focus:ring-1 focus:ring-blue-300/50 transition"
		/>
	);
}

/**
*Renders a submit button for search actions.
*@returns {JSX.Element} The search button component.
*/
function SearchButton() {
    return (
        <button
            type="submit"
            className="lunar-page-subtitle px-4 py-2 rounded-xl bg-blue-400 text-gray-950 font-semibold hover:scale-105 transition"
        >
            Search
        </button>
    );
}

/**
*Renders a button to open the filter modal.
*@param {Object} props - Component props.
*@param {Function} props.onClick - Callback when button is clicked.
*@returns {JSX.Element} The filter button component.
*/
function FilterButton({ onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="lunar-page-subtitle px-4 py-2 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 transition"
        >
            Filter
        </button>
    );
}

/**
*Renders a button to reset search and filter values.
*@param {Object} props - Component props.
*@param {Function} props.onClick - Callback when button is clicked.
*@returns {JSX.Element} The reset button component.
*/
function ResetButton({ onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="lunar-page-subtitle px-3 py-2 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 flex items-center gap-1 transition"
        >
            <FunnelXIcon size={16} />
            Reset
        </button>
    );
}