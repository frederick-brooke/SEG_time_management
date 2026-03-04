export default function ReportFilter({ filters, setFilters, onClose, applyFilters, resetFilters}) {
  return (
    <div
      className="fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 border-l"
      onClick={onClose}
    >
      <div
        className="p-6 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-semibold mb-4">
          Filter and Sort Reports
        </h3>

        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Sort By
          </label>

          <select
            value={filters.sortBy}
            onChange={(e) => setFilters(saved_result => ({
              ...saved_result,
              sortBy: e.target.value,
            }))
            }
            className="w-full border rounded px-3 py-2"
          >
            <option value="createdAt">Date Created</option>
            <option value="status">Status</option>
            <option value="id">Report ID</option>
          </select>
        </div>

        {/* Order */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Order
          </label>

          <select
            value={filters.order}
            onChange={(e) =>
              setFilters(saved_result => ({
                ...saved_result,
                order: e.target.value,
              }))
            }
            className="w-full border rounded px-3 py-2"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) =>
              setFilters(saved_result => ({
                ...saved_result,
                startDate: e.target.value,
              }))
            }
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-sm font-medium mb-1">
            End Date
          </label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) =>
              setFilters(saved_result => ({
                ...saved_result,
                endDate: e.target.value,
              }))
            }
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Status
          </label>

          {["PENDING", "RESOLVED", "REJECTED"].map((stat) => (
            <label key={stat} className="flex items-center space-x-2 mb-1">
              <input
                type="radio"
                name="status"
                value={stat} 
                checked={filters.status === stat}
                onChange={() =>
                  setFilters(saved_result => ({
                    ...saved_result,
                    status: stat,
                  }))
                }
              />
              <span>{stat}</span>
            </label>
          ))}

          {/* Clear status */}
          <button
            type="button"
            onClick={() =>
              setFilters(saved_result => ({
                ...saved_result,
                status: "",
              }))
            }
            className="text-sm text-blue-600 mt-2"
          >
            Clear Status Filter
          </button>
        </div>

        <button onClick={applyFilters}
            className="w-full bg-blue-800 text-white py-2 rounded hover:bg-gray-700 transition"
        >
            Apply Filters
        </button>

        <button onClick={resetFilters}
            className="w-full bg-red-800 text-white py-2 rounded hover:bg-gray-700 transition"
        >
            Reset Filters
        </button>

        <button
          onClick={onClose}
          className="mt-6 w-full bg-gray-800 text-white py-2 rounded hover:bg-gray-700 transition"
        >
          Close
        </button>
      </div>
    </div>
  );
}