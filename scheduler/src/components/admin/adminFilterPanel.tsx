const inputCls  = "w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white";
const selectCls = `${inputCls} focus:outline-none`;

export function FilterPanel({ onClose, onReset, children }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="h-full w-96 p-6 flex flex-col gap-6 bg-white/5 backdrop-blur-xl border-l border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="lunar-header text-lg font-semibold text-white">Filters</h3>
          <button onClick={onReset} className="lunar-page-subtitle px-4 py-2 rounded-xl bg-white/5 text-white hover:bg-white/10 transition">
            Reset
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function FilterSortGroup({ sortBy, order, sortOptions, onSortChange, onOrderChange }) {
  return (
    <div className="space-y-3">
      <label className="lunar-page-subtitle text-xs uppercase text-white/40 tracking-wider">Sorting</label>
      <select value={sortBy} onChange={(e) => onSortChange(e.target.value)} className={selectCls}>
        {sortOptions.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
      </select>
      <select value={order} onChange={(e) => onOrderChange(e.target.value)} className={selectCls}>
        <option value="asc">Ascending</option>
        <option value="desc">Descending</option>
      </select>
    </div>
  );
}

export function FilterDateRange({ label = "Dates", startDate, endDate, onStartChange, onEndChange }) {
  return (
    <div className="space-y-3">
      <p className="lunar-page-subtitle text-xs uppercase text-white/40 tracking-wider">{label}</p>
      <input type="date" value={startDate} onChange={(e) => onStartChange(e.target.value)} className={inputCls} />
      <input type="date" value={endDate}   onChange={(e) => onEndChange(e.target.value)}   className={inputCls} />
    </div>
  );
}

export function FilterToggleGroup({ label, options, isActive, onToggle }) {
  return (
    <div className="space-y-3">
      <p className="lunar-page-subtitle text-xs uppercase text-white/40 tracking-wider">{label}</p>
      <div className="flex flex-col gap-2">
        {options.map(({ value, label }) => (
          <button key={value} onClick={() => onToggle(value)}
            className={`px-3 py-2 rounded-lg text-left transition ${isActive(value) ? "bg-blue-300 text-gray-900" : "bg-white/5 text-white/70 hover:bg-white/10"}`}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function FilterActions({ onApply, onClose }) {
  return (
    <div className="mt-auto space-y-3">
      <button onClick={onApply} className="lunar-page-subtitle w-full py-2 rounded-xl bg-blue-300 text-gray-900 font-medium hover:scale-[1.02] transition">
        Apply Filters
      </button>
      <button onClick={onClose} className="lunar-page-subtitle w-full py-2 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 transition">
        Close
      </button>
    </div>
  );
}