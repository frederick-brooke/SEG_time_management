export default function UserFilter({ sortBy, setSortBy, order, setOrder, onClose, startDate, setStartDate, endDate, setEndDate, categories, setCategories}) {

    return (
    <div
      className="fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 border-l"
      onClick={onClose} //click outside closes
    >
      <div
        className="p-6 space-y-6"
        onClick={(e) => e.stopPropagation()} //prevent closing when clicking inside
      >
        <h3 className="text-xl font-semibold mb-4">
          Filter and Sort
        </h3>

        {/* Sort by username, date of creation or email*/}
        <div className="space-y-2">
          <label className="block text-sm font-medium mb-1">
            Sort By
          </label>

          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
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
                value={order}
                onChange={(e) => setOrder(e.target.value)}
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
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border rounded px-3 py-2"
            />
        </div>

        <div>
            <label className="block text-sm font-medium mb-1">
                End Date
            </label>
            <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
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
                    checked={categories.includes(cat)}
                    onChange={(e) => {
                    if (e.target.checked) {
                        setCategories([...categories, cat]);
                    } else {
                        setCategories(categories.filter((c) => c !== cat));
                    }
                    }}
                />
                    <span>
                        {cat === "SUPERUSER" && "Admin"}
                        {cat === "BASIC" && "Basic"}
                    </span>
                </label>
            ))}
        </div>

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