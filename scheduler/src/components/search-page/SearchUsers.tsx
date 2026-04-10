"use client";

import { useState, useEffect } from "react";
import UserPanel from "@/components/admin/AdminUserPanel";
import UserCard from "./UserCards";
import {
	addRecentUser,
	getRecentUsers,
	removeRecentUser,
	clearRecentUsers,
} from "@/lib/recent-users";
import { IconX } from "@tabler/icons-react";

/**
 * SearchUsers
 *
 * Displays user search results along with recent user history.
 * Handles:
 * - Rendering paginated user results
 * - Tracking and displaying recently viewed users
 * - Managing selection of a user (opens UserPanel)
 * - Pagination calculations
 * - Resetting and updating filters
 *
 * @param {Object} props
 * @param {Array} props.users - List of users returned from API
 * @param {number} props.totalUsers - Total number of users
 * @param {number} props.totalUserPages - Total pages available
 * @param {Function} props.setIsUserFilterOpen - Opens filter panel
 * @param {Object|null} props.selectedUser - Currently selected user
 * @param {Function} props.setSelectedUser - Sets selected user
 * @param {Object} props.filters - Active filter state
 * @param {Function} props.setFilters - Updates filters
 * @param {Function} props.resetFilters - Resets filters to default
 *
 * @returns {JSX.Element} User search results UI
 */
export default function SearchUsers({
	users,
	totalUsers,
	totalUserPages,
	setIsUserFilterOpen,
	selectedUser,
	setSelectedUser,
	filters,
	setFilters,
	resetFilters,
}) {
	const [recentUsers, setRecentUsers] = useState([]);

	const isSearching = filters.search !== "";

	const { start, end } = getPaginationRange(filters, totalUsers);

	useEffect(() => {
		if (!isSearching) setRecentUsers(getRecentUsers());
	}, [isSearching]);

	return (
		<div className="flex-1 min-h-0 flex flex-col">
			<div className="lunar-glass min-h-0 flex flex-1 flex-col p-4 overflow-hidden">
				<Header
					isSearching={isSearching}
					hasRecent={recentUsers.length > 0}
					onClear={() => handleClearRecent(setRecentUsers)}
				/>

				<div className="flex-1 flex flex-col gap-1 min-h-0 overflow-hidden">
					{!isSearching && (
						<RecentUsersList
							users={recentUsers}
							setRecentUsers={setRecentUsers}
						/>
					)}

					{isSearching && <SearchResults users={users} />}
				</div>

				{isSearching && users.length > 0 && (
					<Pagination
						filters={filters}
						setFilters={setFilters}
						start={start}
						end={end}
						totalUsers={totalUsers}
						totalPages={totalUserPages}
					/>
				)}
			</div>
			<UserPanel
				user={selectedUser}
				onClose={() => setSelectedUser(null)}
			/>
		</div>
	);
}

/**
 *Calculates the pagination range for displaying item indices.
 *@param {Object} filters - The current filter state.
 *@param {number} filters.page - Current page number.
 *@param {number} filters.limit - Items per page.
 *@param {number} total - Total number of items across all pages.
 *@returns {Object} The start and end indices for the current page.
 *@returns {number} returns.start - The starting index (1-indexed).
 *@returns {number} returns.end - The ending index (1-indexed).
 */
function getPaginationRange(filters, total) {
	const start = (filters.page - 1) * filters.limit + 1;
	const end = Math.min(filters.page * filters.limit, total);
	return { start, end };
}

/**
 *Clears recent users from storage and updates state.
 *@param {Function} setRecentUsers - State setter for recent users list.
 */
function handleClearRecent(setRecentUsers) {
	clearRecentUsers();
	setRecentUsers([]);
}

/**
 *Handles user click by adding to recent searches and navigating to profile.
 *@param {Object} user - The user object.
 */
function handleUserClick(user) {
	addRecentUser(user);
	window.location.assign(`/profile/${user.username}`);
}

/**
 *Removes a user from recent searches.
 *@param {Object} user - The user object to remove.
 *@param {Function} setRecentUsers - State setter for recent users list.
 */
function handleRemove(user, setRecentUsers) {
	removeRecentUser(user.username);
	setRecentUsers(getRecentUsers());
}

/**
 *Renders the header section for search results or recent users.
 *@param {Object} props - Component props.
 *@param {boolean} props.isSearching - Whether search mode is active.
 *@param {boolean} props.hasRecent - Whether there are recent users to display.
 *@param {Function} props.onClear - Callback to clear recent users.
 *@returns {JSX.Element} The header component.
 */
function Header({ isSearching, hasRecent, onClear }) {
	return (
		<div className="flex justify-between items-center mb-3 flex-shrink-0">
			<p className="lunar-label text-sm font-semibold text-white/70">
				{isSearching ? "Users" : "Recent Searches"}
			</p>

			{!isSearching && hasRecent && (
				<button
					onClick={onClear}
					className="text-sm text-red-400 hover:text-red-500 transition font-medium"
				>
					Clear All
				</button>
			)}
		</div>
	);
}

/**
 *Renders the list of recent users.
 *@param {Object} props - Component props.
 *@param {Array} props.users - Array of recent user objects.
 *@param {Function} props.setRecentUsers - State setter for recent users list.
 *@returns {JSX.Element} The recent users list component.
 */
function RecentUsersList({ users, setRecentUsers }) {
	if (users.length === 0) {
		return (
			<p className="lunar-form-subtitle text-gray-400 text-center mt-10">
				{" "}
				No recent searches{" "}
			</p>
		);
	}

	return users.map((user) => (
		<UserCard
			key={user.username}
			user={user}
			onClick={() => handleUserClick(user)}
			onRemove={() => handleRemove(user, setRecentUsers)}
		/>
	));
}

/**
 *Renders the search results list.
 *@param {Object} props - Component props.
 *@param {Array} props.users - Array of user search results.
 *@returns {JSX.Element} The search results component.
 */
function SearchResults({ users }) {
	if (users.length === 0) {
		return (
			<p className="lunar-form-subtitle text-gray-400 text-center mt-10">
				No users found
			</p>
		);
	}

	return users.map((user) => (
		<UserCard
			key={user.id}
			user={user}
			onClick={() => handleUserClick(user)}
		/>
	));
}

/**
 *Renders pagination controls for navigating search results.
 *@param {Object} props - Component props.
 *@param {Object} props.filters - Current filter state.
 *@param {Function} props.setFilters - State setter for filters.
 *@param {number} props.start - Starting index of current page.
 *@param {number} props.end - Ending index of current page.
 *@param {number} props.totalUsers - Total number of users.
 *@param {number} props.totalPages - Total number of pages.
 *@returns {JSX.Element} The pagination component.
 */
function Pagination({
	filters,
	setFilters,
	start,
	end,
	totalUsers,
	totalPages,
}) {
	return (
		<div className="mt-2 pt-2 border-t border-white/10 flex justify-between items-center text-white/70 text-sm">
			<button
				disabled={filters.page === 1}
				onClick={() =>
					setFilters((prev) => ({ ...prev, page: prev.page - 1 }))
				}
				className="px-3 py-1 rounded-md border border-white/20 text-white/70 hover:bg-white/10 disabled:opacity-40 transition"
			>
				Previous
			</button>

			<span>
				{" "}
				{start}-{end} of {totalUsers}{" "}
			</span>

			<button
				disabled={filters.page === totalPages}
				onClick={() =>
					setFilters((prev) => ({ ...prev, page: prev.page + 1 }))
				}
				className="px-3 py-1 rounded-md border border-white/20 text-white/70 hover:bg-white/10 disabled:opacity-40 transition"
			>
				Next
			</button>
		</div>
	);
}
