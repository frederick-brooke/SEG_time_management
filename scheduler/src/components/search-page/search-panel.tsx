"use client";

import { useState, useEffect } from "react";
import SearchControls from "@/components/search-page/search-controls";
import SearchUsers from "@/components/search-page/searchUsers";
import UserFilter from "@/components/admin/user-filter-panel";

import { useUsers } from "@/hooks/useUsers";

//UI components
import GlassCard from "@/components/ui/glassCard";
import LunarDrawer from "../layout/lunar-drawer";

/**
 * SearchPanel
 *
 * Main search interface rendered inside a drawer.
 * Handles:
 * - Managing user search filters (draft vs applied)
 * - Debounced search input updates
 * - Fetching users via useUsers hook
 * - Opening/closing filter panel
 * - Passing data to search result components
 *
 * @param {Object} props
 * @param {boolean} props.open - Controls visibility of the search panel
 * @param {Function} props.onClose - Closes the search panel
 *
 * @returns {JSX.Element} Search panel UI
 */
export default function SearchPanel({ open, onClose }) {
	const defaultUserFilters = { search: "", sortBy: "username", order: "desc", startDate: "", endDate: "", categories: [], page: 1, limit: 6,};

	const [appliedUserFilters, setAppliedUserFilters] = useState(defaultUserFilters);
	const [draftUserFilters, setDraftUserFilters] = useState(defaultUserFilters);
	const [isUserFilterOpen, setIsUserFilterOpen] = useState(false);

	useDebouncedSearch(draftUserFilters.search, setAppliedUserFilters);

	const { users, totalUserPages, totalUsers } = useUsers(
		appliedUserFilters,
		"/api/users/search"
	);

	return (
		<>
			<LunarDrawer open={open} onClose={onClose} side="left" title="Search Panel" width="w-full sm:w-[420px]">
				<div className="p-4 flex-shrink-0">
					<GlassCard className="p-3">
						<SearchControls
							filters={appliedUserFilters}
							setFilters={setAppliedUserFilters}
							placeholder="Search users..."
							onOpenFilter={() => setIsUserFilterOpen(true)}
							resetFilters={() => resetUserFilters(setDraftUserFilters, setAppliedUserFilters, defaultUserFilters)}
						/>
					</GlassCard>
				</div>

				<div className="flex flex-1 flex-col p-4 min-h-0">
					<SearchUsers users={users} totalUsers={totalUsers} totalUserPages={totalUserPages} setIsUserFilterOpen={setIsUserFilterOpen} filters={appliedUserFilters} setFilters={setAppliedUserFilters} selectedUser={null} setSelectedUser={() => {}} resetFilters={() => resetUserFilters(setDraftUserFilters, setAppliedUserFilters, defaultUserFilters)}/>
				</div>
			</LunarDrawer>

			<LunarDrawer open={isUserFilterOpen} onClose={() => setIsUserFilterOpen(false)} side="right" title="User Filters" width="400px">
				<UserFilter
					filters={draftUserFilters}
					setFilters={setDraftUserFilters}
					onClose={() => setIsUserFilterOpen(false)}
					applyFilters={() =>
						applyFilters(draftUserFilters, setAppliedUserFilters, setIsUserFilterOpen)
					}
					resetFilters={() =>
						resetUserFilters(setDraftUserFilters, setAppliedUserFilters, defaultUserFilters)
					}
					type="admin"
				/>
			</LunarDrawer>
		</>
	);
}

/**
*Custom hook that debounces search input to prevent excessive filter updates.
*@param {string} search - The search input value.
*@param {Function} setFilters - State setter function for filters.
*/
function useDebouncedSearch(search, setFilters) {
	useEffect(() => {
		const delay = setTimeout(() => {
			setFilters((prev) => ({
				...prev,
				search,
				page: 1,
			}));
		}, 300);

		return () => clearTimeout(delay);
	}, [search, setFilters]);
}

/**
*Applies draft filters to the applied state and closes the filter modal.
*@param {Object} draftFilters - The draft filter values to apply.
*@param {Function} setAppliedFilters - State setter for applied filters.
*@param {Function} setOpen - State setter to close the filter modal.
*/
function applyFilters(draftFilters, setAppliedFilters, setOpen) {
	setAppliedFilters((prev) => ({
		...draftFilters,
		search: prev.search,
	}));
	setOpen(false);
}

/**
*Resets both draft and applied filters to their default values.
*@param {Function} setDraft - State setter for draft filters.
*@param {Function} setApplied - State setter for applied filters.
*@param {Object} defaults - The default filter values.
*/
function resetUserFilters(setDraft, setApplied, defaults) {
	setDraft(defaults);
	setApplied(defaults);
}