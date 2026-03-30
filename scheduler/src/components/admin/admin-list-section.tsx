import { useState } from "react";
import { FunnelXIcon } from "lucide-react";
/**
 * Shared layout for the users, reports and appeals sections
 *
 * @param {Object} props - Component props
 * @param {string} props.title - section heading
 * @param {array} props.items - array of records to display
 * @param {number} props.totalItems - total record count
 * @param {filters} props.filters - current filter state
 * @param {number} props.totalPages - total page count
 * @param {function} props.setFilters - setter for filter state
 * @param {function} props.onFilterOpen- opens the filter drawer
 * @param {function} props.resetFilters - resets all applied filters
 * @param {(item: any, index: number) = JSX.Element} props.renderItem- renders a single row of the results list
 * @param {() = JSX.Element | null}props.renderPanel - renders the associated panel
 * @param {boolean} props.searchable 
 * @param {string} props.itemLabel - labels shown in the count line
 * 
 */
export default function AdminListSection(props) {
  const {
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
  } = props;

  const [inputValue, setInputValue] = useState(filters?.search ?? "");

  const limit = filters?.limit ?? 12;
  const page = filters?.page ?? 1;

  const start = items.length === 0 ? 0 : (page - 1) * limit + 1;
  const end = items.length === 0 ? 0 : start + items.length - 1;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, search: inputValue, page: 1 }));
  };

  const handleReset = () => {
    setInputValue("");
    resetFilters();
  };

  return (
    <section className="mb-6 flex flex-col h-[600px]">
      <Header
        title={title}
        searchable={searchable}
        onFilterOpen={onFilterOpen}
      />

      {searchable && (
        <SearchForm
          inputValue={inputValue}
          setInputValue={setInputValue}
          onSubmit={handleSearchSubmit}
          onReset={handleReset}
          onFilterOpen={onFilterOpen}
          itemLabel={itemLabel}
        />
      )}

      <ItemList items={items} renderItem={renderItem} />

      <ItemCount
        items={items}
        start={start}
        end={end}
        totalItems={totalItems}
        itemLabel={itemLabel}
      />

      <PaginationBar
        page={page}
        totalPages={totalPages}
        setFilters={setFilters}
      />

      {renderPanel()}
    </section>
  );
}

function Header({ title, searchable, onFilterOpen }) {
  return (
    <div className="flex items-center justify-between mb-4 flex-shrink-0">
      <h2 className="lunar-header text-xl text-white font-semibold">
        {title}
      </h2>

      {!searchable && <FilterButton onClick={onFilterOpen} />}
    </div>
  );
}

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

function SearchForm({
  inputValue,
  setInputValue,
  onSubmit,
  onReset,
  onFilterOpen,
  itemLabel,
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="flex items-center gap-2 mb-4 flex-shrink-0"
    >
      <input
        type="text"
        placeholder={`Search ${itemLabel}...`}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-blue-300/50 w-full max-w-sm"
      />

      <button
        type="submit"
        className="lunar-page-subtitle px-4 py-2 rounded-xl bg-blue-300 text-gray-950 font-medium hover:scale-105 transition"
      >
        Search
      </button>

      <FilterButton onClick={onFilterOpen} />

      <button
        type="button"
        onClick={onReset}
        className="lunar-page-subtitle p-2 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 transition"
      >
        <FunnelXIcon size={18} />
      </button>
    </form>
  );
}

function ItemList({ items, renderItem }) {
  return (
    <ul className="space-y-2 flex-1 overflow-y-auto min-h-0 pr-1">
      {items.map((item, i) => renderItem(item, i))}
    </ul>
  );
}

function ItemCount({ items, start, end, totalItems, itemLabel }) {
  if (items.length === 0) {
    return (
      <div className="mt-4 flex justify-center flex-shrink-0">
        <p className="text-sm text-white/40 mt-4">
          No {itemLabel} found.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 flex justify-center flex-shrink-0">
      <p className="text-sm text-white/60">
        Showing{" "}
        <span className="font-semibold text-white">
          {start}–{end}
        </span>{" "}
        of{" "}
        <span className="font-semibold text-white">
          {totalItems}
        </span>{" "}
        {itemLabel}
      </p>
    </div>
  );
}

function PaginationBar({ page, totalPages, setFilters }) {
  if (totalPages < 1) return null;

  return (
    <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10 flex-shrink-0">
      <button
        disabled={page === 1}
        onClick={() =>
          setFilters((prev) => ({
            ...prev,
            page: (prev.page ?? 1) - 1,
          }))
        }
        className="px-3 py-1 border rounded-lg bg-white/5 text-white/70 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Previous
      </button>

      <span className="text-sm text-white/60">
        Page {page} of {totalPages}
      </span>

      <button
        disabled={page === totalPages}
        onClick={() =>
          setFilters((prev) => ({
            ...prev,
            page: (prev.page ?? 1) + 1,
          }))
        }
        className="px-3 py-1 border rounded-lg bg-white/5 text-white/70 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </div>
  );
}