import { FilterPanel, FilterSortGroup, FilterDateRange, FilterToggleGroup, FilterActions } from "@/components/admin/AdminFilterPanel";

//polymorphic specific filter attributes
const sortOptions = [{ value: "username", label: "Username" }, { value: "createdAt", label: "Date Created" }, { value: "email", label: "Email" }];
const roleOptions = [{ value: "SUPERUSER", label: "Admin" }, { value: "BASIC", label: "Basic" }];

/**
 * UserFilter
 *
 * Slide-over filter panel for refining user queries.
 * Handles:
 * - Sorting (username, date created, email)
 * - Sort order (ascending / descending)
 * - Conditional admin-only filters (date range + roles)
 * - Multi-select role filtering
 * - Resetting, applying, and closing filters
 *
 * @param {Object} props
 * @param {Object} props.filters - Current filter state
 * @param {Function} props.setFilters - State setter for filters
 * @param {Function} props.onClose - Closes the filter panel
 * @param {Function} props.applyFilters - Applies selected filters
 * @param {Function} props.resetFilters - Resets filters to default state
 * @param {string} props.type - Determines filter visibility (e.g. "admin")
 *
 * @returns {JSX.Element} User filter sidebar UI
 */
export default function UserFilter({ filters, setFilters, onClose, applyFilters, resetFilters, type }) {
	const update     = (patch) => setFilters((prev) => ({ ...prev, ...patch, page: 1 }));
	const toggleRole = (val) => {
		const next = filters.categories.includes(val)
		? filters.categories.filter((c) => c !== val)
		: [...filters.categories, val];
		update({ categories: next });
	};

	return (
		<FilterPanel onClose={onClose} onReset={resetFilters}>
		<FilterSortGroup
			sortBy={filters.sortBy} order={filters.order} sortOptions={sortOptions}
			onSortChange={(v) => update({ sortBy: v })} onOrderChange={(v) => update({ order: v })}
		/>
		{type === "admin" && (
			<FilterDateRange label="Creation Date"
			startDate={filters.startDate} endDate={filters.endDate}
			onStartChange={(v) => update({ startDate: v })} onEndChange={(v) => update({ endDate: v })}
			/>
		)}
		{type === "admin" && (
			<FilterToggleGroup label="Roles" options={roleOptions} isActive={(v) => filters.categories.includes(v)} onToggle={toggleRole} />
		)}
		<FilterActions onApply={applyFilters} onClose={onClose} />
		</FilterPanel>
	);
}