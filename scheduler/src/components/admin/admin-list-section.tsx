import { useState } from "react";
import { FunnelXIcon } from "lucide-react";

/**
 * Shared layout for the users, reports and appeals sections
 *
 * @param {Object} props - Component props
 * @param {title} props.title - section heading
 * @param {record} props.items - array of records to display
 * @param {Number} props.totalItems - total record count
 * @param {filters} props.filters - current filter state
 * @param {totalPages} props.totalPages - total page count
 * @param {setFilters} props.setFilters - setter for filter state
 * @param {onFilterOpen} props.onFilterOpen- opens the filter drawer
 * @param {resetFilters} props.resetFilters - resets all applied filters
 * @param {} props.renderItem- renders a single row of the results list
 * @param {} props.renderPanel - renders the associated panel
 * @param {Boolean} props.searchable 
 * @param {String} props.itemLabel - labels shown in the count line
 * 
 */
export default function AdminListSection({
  title,
  items = [],
  totalItems,
  totalPages,
  filters,
  setFilters,
  onFilterOpen,
  resetFilters,
  renderItem,
  renderPanel,
  searchable = false,
  itemLabel = "items",
}) {
  const [inputValue, setInputValue] = useState(filters?.search ?? "");

  const limit = filters?.limit ?? 12;
  const page  = filters?.page  ?? 1;

  const start = items.length === 0 ? 0 : (page - 1) * limit + 1;
  const end   = items.length === 0 ? 0 : start + items.length - 1;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, search: inputValue, page: 1 }));
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handleReset = () => {
    setInputValue("");
    resetFilters();
  };

  return (
    <section className="mb-6 flex flex-col h-[600px]">
      {/*  Header  */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h2 className="lunar-header text-xl text-white font-semibold">{title}</h2>

        {!searchable && (
          <button
            type="button"
            onClick={onFilterOpen}
            className="lunar-page-subtitle px-4 py-2 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 transition"
          >
            Filter
          </button>
        )}
      </div>

      {/*  Search bar (for UserManagement only)  */}
      {searchable && (
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 mb-4 flex-shrink-0">
          <input
            type="text"
            placeholder={`Search ${itemLabel}...`}
            value={inputValue}
            onChange={handleSearchChange}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-blue-300/50 w-full max-w-sm"
          />

          <button
            type="submit"
            className="lunar-page-subtitle px-4 py-2 rounded-xl bg-blue-300 text-gray-950 font-medium hover:scale-105 transition"
          >
            Search
          </button>

          <button
            type="button"
            onClick={onFilterOpen}
            className="lunar-page-subtitle px-4 py-2 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 transition"
          >
            Filter
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="p-2 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 transition"
          >
            <FunnelXIcon size={18} />
          </button>
        </form>
      )}

      {/*  List  */}
      <ul className="space-y-2 flex-1 overflow-y-auto min-h-0 pr-1">
        {items.map((item, i) => renderItem(item, i))}
      </ul>

      {/*  Count  */}
      <div className="mt-4 flex justify-center flex-shrink-0">
        {items.length !== 0 ? (
          <p className="text-sm text-white/60">
            Showing{" "}
            <span className="font-semibold text-white">{start}–{end}</span>
            {" "}of{" "}
            <span className="font-semibold text-white">{totalItems}</span>
            {" "}{itemLabel}
          </p>
        ) : (
          <p className="text-sm text-white/40 mt-4">No {itemLabel} found.</p>
        )}
      </div>

      {/*  Pagination  */}
      {totalPages >= 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10 flex-shrink-0">
          <button
            disabled={page === 1}
            onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) - 1 }))}
            className="px-3 py-1 border rounded-lg bg-white/5 text-white/70 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <span className="text-sm text-white/60">
            Page {page} of {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) + 1 }))}
            className="px-3 py-1 border rounded-lg bg-white/5 text-white/70 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/*  Detail panel  */}
      {renderPanel()}
    </section>
  );
}