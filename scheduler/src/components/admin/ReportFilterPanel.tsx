import { FilterPanel, FilterSortGroup, FilterDateRange, FilterToggleGroup, FilterActions } from "@/components/admin/AdminFilterPanel";

//polymorphic specific filter attributes
const sortOptions   = [{ value: "createdAt", label: "Date Created" }, { value: "status", label: "Status" }, { value: "id", label: "Report ID" }];
const statusOptions = [{ value: "PENDING", label: "PENDING" }, { value: "RESOLVED", label: "RESOLVED" }, { value: "REJECTED", label: "REJECTED" }];

/**
 * ReportFilter
 *
 * Slide-over filter panel for refining report queries.
 * Handles:
 * - Sorting (field + order)
 * - Date range filtering
 * - Status selection (toggle-based)
 * - Resetting and applying filters
 * - Closing via backdrop or button
 *
 * @param {Object} props
 * @param {Object} props.filters - Current filter state
 * @param {Function} props.setFilters - State setter for filters
 * @param {Function} props.onClose - Closes the filter panel
 * @param {Function} props.applyFilters - Applies current filters
 * @param {Function} props.resetFilters - Resets filters to default state
 *
 * @returns {JSX.Element} Filter sidebar UI
 */
export default function ReportFilter({ filters, setFilters, onClose, applyFilters, resetFilters }) {
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