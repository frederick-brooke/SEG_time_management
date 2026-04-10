"use client";
import { useState } from "react";
import { FunnelXIcon, Search } from "lucide-react";

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
export default function SearchControls({
	filters,
	setFilters,
	resetFilters,
	onOpenFilter,
	placeholder = "Search...",
}) {
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
		<div className="lunar-glass p-4 flex flex-col gap-3">
			<form
				onSubmit={handleSubmit}
				className="flex flex-col gap-3 w-full"
			>
				<div className="flex items-center gap-2 w-full">
					<SearchInput
						value={inputValue}
						onChange={handleChange}
						placeholder={placeholder}
					/>

					<SearchButton />
				</div>

				<div className="flex items-center justify-between gap-2 w-full">
					<FilterButton onClick={onOpenFilter} />

					<ResetButton onClick={handleReset} />
				</div>
			</form>
		</div>
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
			className="lunar-input flex-1 min-w-[200px]"
		/>
	);
}

/**
 *Renders a submit button for search actions with magnifying glass icon.
 *@returns {JSX.Element} The search button component.
 */
function SearchButton() {
	return (
		<button
			type="submit"
			className="px-4 py-2 rounded-2xl bg-blue-300 text-gray-950 font-semibold shadow-[0_0_30px_rgba(90,150,255,0.25)] hover:shadow-[0_0_50px_rgba(90,150,255,0.45)] transition flex items-center justify-center"
		>
			<Search size={20} />
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
			className="flex-1 px-6 py-2 rounded-2xl bg-white/5 ring-1 ring-white/10 text-white/80 font-medium hover:bg-white/10 transition"
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
			className="flex-1 px-6 py-2 rounded-2xl bg-white/5 ring-1 ring-white/10 text-white/80 font-medium hover:bg-white/10 transition flex items-center justify-center gap-1"
		>
			<FunnelXIcon size={16} />
			Reset
		</button>
	);
}
