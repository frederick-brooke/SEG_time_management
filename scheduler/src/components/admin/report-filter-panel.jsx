export default function ReportFilter({ filters, setFilters, onClose, applyFilters, resetFilters}) {
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-blue/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="h-full w-96 p-6 flex flex-col gap-6 bg-white/5 backdrop-blur-xl border-l border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            Filters
          </h3>

          <button
            onClick={resetFilters}
            className="px-4 py-2 rounded-xl bg-white/5 text-white hover:bg-white/10 transition"
          >
            Reset
          </button>
        </div>

        {/* Sort By */}
        <div className="space-y-3">
          <label className="text-xs uppercase text-white/40 tracking-wider">
            Sorting
          </label>

          <select
            value={filters.sortBy}
              onChange={(e) => setFilters(saved_result => ({
                ...saved_result,
                sortBy: e.target.value,
              }))
            }
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
          >
            <option value="createdAt">Date Created</option>
            <option value="status">Status</option>
            <option value="id">Report ID</option>
          </select>

          {/* Order */}
          <select
            value={filters.order}
            onChange={(e) =>
              setFilters(saved_result => ({
                ...saved_result,
                order: e.target.value,
              }))
            }
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>

        {/* Date manipulation */}
        <div className="space-y-3">
          <p className="text-xs uppercase text-white/40 tracking-wider">
            Dates
          </p>

          <input
            type="date"
            value={filters.startDate}
            onChange={(e) =>
              setFilters(saved_result => ({
                ...saved_result,
                startDate: e.target.value,
              }))
            }
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
          />

          {/* End Date */}
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                endDate: e.target.value,
                page: 1,
              }))
            }
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
          />
        </div>

        {/* Status Filter */}
        <div className="space-y-3">
          <p className="text-xs uppercase text-white/40 tracking-wider">
            Status
          </p>

          <div className="flex flex-col gap-2">
            {["PENDING", "RESOLVED", "REJECTED"].map((stat) => {
              const active = filters.status === stat;

              return (
                <button
                  key={stat}
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      status: active ? "" : stat,
                      page: 1,
                    }))
                  }
                  className={`
                    px-3 py-2 rounded-lg text-left transition
                    ${
                      active
                        ? "bg-blue-300 text-gray-900"
                        : "bg-white/5 text-white/70 hover:bg-white/10"
                    }
                  `}
                >
                  {stat}
                </button>
              );
            })}
          </div>
        </div>

        {/* actions */}
        <div className="mt-auto space-y-3">
          <button
            onClick={applyFilters}
            className="w-full py-2 rounded-xl bg-blue-300 text-gray-900 font-medium hover:scale-[1.02] transition"
          >
            Apply Filters
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}