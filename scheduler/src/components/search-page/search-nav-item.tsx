import { useState } from "react";
import { useRouter } from "next/router";
import { IconSearch } from "@tabler/icons-react";

/**
 * SearchNavItem
 *
 * Navigation bar search input component.
 * Handles:
 * - Capturing user search query
 * - Preventing empty submissions
 * - Navigating to search results page with encoded query
 * @returns {JSX.Element} Search input navigation item
 */
export default function SearchNavItem() {
	const [query, setQuery] = useState("");		// Local state for search query input
	const router = useRouter();		// Next.js router for client-side navigation

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (query.trim() !== "") {
		router.push(`/search?query=${encodeURIComponent(query)}`);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl px-3 py-1 hover:border-blue-400/50 focus-within:border-blue-500 transition-all duration-300">
		{/* Search icon */}
		<IconSearch className="lunar-page-subtitle text-white/70" />
		{/* Search input */}
		<input
			type="text"
			value={query}
			onChange={(e) => setQuery(e.target.value)}
			placeholder="Search..."
			className="bg-transparent flex-1 text-white placeholder:text-white/50 focus:outline-none"
		/>
		</form>
	);
}