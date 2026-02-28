export default function UserFilter({ filters, setFilters, onClose, resetFilters}) {

    return (
    <div
      className="fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 border-l"
      onClick={onClose} //click outside closes
    >
      <div
        className="p-6 space-y-6"
        onClick={(e) => e.stopPropagation()} //prevent closing when clicking inside
      >
        <h3 className="text-xl flex font-semibold mb-4">
          Filter and Sort

          {/* reset button to clear all filters*/}
        </h3>

        {/* Sort by username, date of creation or email*/}
        <div className="space-y-2">
          <label className="block text-sm font-medium mb-1">
            Sort By
          </label>

          <select 
            value={filters.sortBy}
            onChange={(e) => 
                    setFilters(saved_result => ({
                        ...saved_result,
                        sortBy: e.target.value,
                        page:1,
                    })
                )                
            }
            className="w-full border rounded px-3 py-2"
          >
            <option value="username">Username</option>
            <option value="createdAt">Date Created</option>
            <option value="email">Email</option>
          </select>
        </div>

        {/* Order by asc or desc */}
        <div>
            <label className="block text-sm font-medium mb-1">
                Order By
            </label>

            <select 
                value={filters.order}
                onChange={(e) => 
                    setFilters(saved_result => ({
                        ...saved_result,
                        order: e.target.value,
                        page:1,
                    }))                
                }

                className="w-full border rounded px-3 py-2"
            >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
            </select>
        </div>

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
                        page:1,
                    }))                
                }
                className="w-full border rounded px-3 py-2"
            />
        </div>

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
                        page:1,
                    }))                
                }
                className="w-full border rounded px-3 py-2"
            />
        </div>

        <div>
            <label className="block text-sm font-medium mb-2">
                Categories
            </label>

            {["SUPERUSER", "BASIC"].map((cat) => (
                <label key={cat} className="flex items-center space-x-2 mb-1">
                <input
                    type="checkbox"
                    value={cat}
                    checked={filters.categories.includes(cat)}
                    onChange={(newCategories) =>
                        setFilters(saved_result => ({
                            ...saved_result,
                            categories: newCategories,
                            page: 1,
                        }))
                    }
                />
                    <span>
                        {cat === "SUPERUSER" && "Admin"}
                        {cat === "BASIC" && "Basic"}
                    </span>
                </label>
            ))}
        </div>

        <button onClick={resetFilters}
            className="mt-6 w-full bg-red-800 text-white py-2 rounded hover:bg-gray-700 transition"
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