export default function TaskFilter({
  filters,
  setFilters,
  onClose,
  applyFilters,
  resetFilters
}) {

  return (
    <div
      className="fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 border-l"
      onClick={onClose}
    >

      <div
        className="p-6 space-y-6 h-full overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >

        <h3 className="text-xl flex font-semibold mb-4">
          Filter and Sort
        </h3>

        {/* Sort By */}
        <div className="space-y-2">

          <label className="block text-sm font-medium mb-1">
            Sort By
          </label>

          <select
            value={filters.sortBy}
            onChange={(e) =>
              setFilters(prev => ({
                ...prev,
                sortBy: e.target.value,
                page: 1
              }))
            }
            className="w-full border rounded px-3 py-2"
          >
            <option value="createdAt">Date Created</option>
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
            <option value="status">Status</option>
            <option value="title">Title</option>
          </select>

        </div>

        {/* Order */}
        <div>

          <label className="block text-sm font-medium mb-1">
            Order By
          </label>

          <select
            value={filters.order}
            onChange={(e) =>
              setFilters(prev => ({
                ...prev,
                order: e.target.value,
                page: 1
              }))
            }
            className="w-full border rounded px-3 py-2"
          >

            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>

          </select>

        </div>

        {/* Due Date Start */}
        <div>

          <label className="block text-sm font-medium mb-1">
            Due Date (Start)
          </label>

          <input
            type="date"
            value={filters.startDate}
            onChange={(e) =>
              setFilters(prev => ({
                ...prev,
                startDate: e.target.value,
                page: 1
              }))
            }
            className="w-full border rounded px-3 py-2"
          />

        </div>

        {/* Due Date End */}
        <div>

          <label className="block text-sm font-medium mb-1">
            Due Date (End)
          </label>

          <input
            type="date"
            value={filters.endDate}
            onChange={(e) =>
              setFilters(prev => ({
                ...prev,
                endDate: e.target.value,
                page: 1
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

          {["todo", "in-progress", "done"].map((status) => (

            <label key={status} className="flex items-center space-x-2 mb-1">

              <input
                type="checkbox"
                value={status}
                checked={filters.status.includes(status)}
                onChange={(e) => {

                  const checked = e.target.checked;

                  setFilters(prev => ({
                    ...prev,
                    status: checked
                      ? [...prev.status, status]
                      : prev.status.filter(s => s !== status),
                    page: 1
                  }));

                }}
              />

              <span className="capitalize">
                {status}
              </span>

            </label>

          ))}

        </div>

        {/* Priority Filter */}
        <div>

          <label className="block text-sm font-medium mb-2">
            Priority
          </label>

          {["Low", "Medium", "High"].map((priority) => (

            <label key={priority} className="flex items-center space-x-2 mb-1">

              <input
                type="checkbox"
                value={priority}
                checked={filters.priority.includes(priority)}
                onChange={(e) => {

                  const checked = e.target.checked;

                  setFilters(prev => ({
                    ...prev,
                    priority: checked
                      ? [...prev.priority, priority]
                      : prev.priority.filter(p => p !== priority),
                    page: 1
                  }));

                }}
              />

              <span>
                {priority}
              </span>

            </label>

          ))}

        </div>

        {/* Completed */}
        <div>

          <label className="block text-sm font-medium mb-2">
            Completion
          </label>

          <select
            value={filters.completed}
            onChange={(e) =>
              setFilters(prev => ({
                ...prev,
                completed: e.target.value,
                page: 1
              }))
            }
            className="w-full border rounded px-3 py-2"
          >

            <option value="">All</option>
            <option value="true">Completed</option>
            <option value="false">Not Completed</option>

          </select>

        </div>

        {/* Apply */}
        <button
          onClick={applyFilters}
          className="w-full bg-blue-800 text-white py-2 rounded hover:bg-gray-700 transition"
        >
          Apply Filters
        </button>

        {/* Reset */}
        <button
          onClick={resetFilters}
          className="w-full bg-red-800 text-white py-2 rounded hover:bg-gray-700 transition"
        >
          Reset Filters
        </button>

        {/* Close */}
        <button
          onClick={onClose}
          className="w-full bg-gray-800 text-white py-2 rounded hover:bg-gray-700 transition"
        >
          Close
        </button>

      </div>
    </div>
  );
}