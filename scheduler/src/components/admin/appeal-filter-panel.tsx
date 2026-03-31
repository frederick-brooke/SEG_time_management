import { FilterPanel, FilterSortGroup, FilterDateRange, FilterToggleGroup, FilterActions } from "@/components/admin/adminFilterPanel";

//polymorphic specific filter attributes
const sortOptions   = [{ value: "createdAt", label: "Date Created" }, { value: "status", label: "Status" }, { value: "id", label: "Appeal ID" }];
const statusOptions = [{ value: "PENDING", label: "PENDING" }, { value: "APPROVED", label: "APPROVED" }, { value: "REJECTED", label: "REJECTED" }];

/**
 * AppealFilter component
 * 
 * Side panel UI for filtering appeals in the admin dashboard.
 * Allows admins to:
 * - Sort appeals (by date, status, or ID)
 * - Change sort order (ascending/descending)
 * - Filter by date range
 * - Filter by appeal status (PENDING, APPROVED, REJECTED)
 * 
 * @param {Object} props - Component props
 * @param {Object} props.filters - Current filter state
 * @param {Function} props.setFilters - State setter for updating filters
 * @param {Function} props.onClose - Closes the filter panel
 * @param {Function} props.applyFilters - Applies selected filters
 * @param {Function} props.resetFilters - Resets filters to default values
 * 
 * @returns {JSX.Element|null} Filter side panel UI
 */
export default function AppealFilter({ filters, setFilters, onClose, applyFilters, resetFilters }) {
	const update       = (patch) => setFilters((prev) => ({ ...prev, ...patch, page: 1 }));
	const toggleStatus = (val)   => update({ status: filters.status === val ? "" : val });

	return (
		<FilterPanel onClose={onClose} onReset={resetFilters}>
		<FilterSortGroup
			sortBy={filters.sortBy} order={filters.order} sortOptions={sortOptions}
			onSortChange={(v) => update({ sortBy: v })} onOrderChange={(v) => update({ order: v })}
		/>
		<FilterDateRange
			startDate={filters.startDate} endDate={filters.endDate}
			onStartChange={(v) => update({ startDate: v })} onEndChange={(v) => update({ endDate: v })}
		/>
		<FilterToggleGroup label="Status" options={statusOptions} isActive={(v) => filters.status === v} onToggle={toggleStatus} />
		<FilterActions onApply={applyFilters} onClose={onClose} />
		</FilterPanel>
	);
}