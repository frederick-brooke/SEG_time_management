export default function UserFilter({ filters, setFilters, onClose, applyFilters, resetFilters, type}) {
    return (
        <div
        className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm"
        onClick={onClose} //click outside closes
        >
            <div
                className="h-full w-96 p-6 flex flex-col gap-6 bg-white/5 backdrop-blur-xl border-l border-white/10 shadow-2xl"
                onClick={(e) => e.stopPropagation()} //prevent closing when clicking inside
            >
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold mb-4">
                        Filters
                    </h3>

                    {/* reset button to clear all filters*/}
                    <button onClick={resetFilters}
                        className="px-4 py-2 rounded-xl bg-white/5 text-white hover:bg-white/10 transition"
                    >
                        Reset
                    </button>
                </div>
            

                {/* Sort by username, date of creation or email*/}
                <div className="space-y-3">
                    <label className="text-xs uppercase text-white/40 tracking-wider">
                        Sorting
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
                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
                    >
                        <option value="username">Username</option>
                        <option value="createdAt">Date Created</option>
                        <option value="email">Email</option>
                    </select>

                    {/* Order by asc or desc */}
                    <select 
                        value={filters.order}
                        onChange={(e) => 
                            setFilters(saved_result => ({
                                ...saved_result,
                                order: e.target.value,
                                page:1,
                            }))                
                        }
                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
                    >
                        <option value="asc">Ascending</option>
                        <option value="desc">Descending</option>
                    </select>
                </div>
        
                {type=="admin" && (
                    <div className="space-y-3">
                        <label className="block text-sm font-medium mb-1">
                            Creation Date
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
                            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                        />
                        
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
                            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                        />
                    </div>
                )}

                {type === "admin" && (
                    <div className="space-y-3">
                        <p className="text-xs uppercase text-white/40 tracking-wider">
                            Roles
                        </p>

                        <div className="flex flex-col gap-2">
                            {["SUPERUSER", "BASIC"].map((cat) => {
                                const active = filters.categories.includes(cat); //default selection

                                return (
                                    <button
                                        key={cat}
                                        onClick={() => {
                                            setFilters((prev) => ({
                                                ...prev,
                                                categories: active
                                                ? prev.categories.filter((c) => c !== cat)
                                                : [...prev.categories, cat],
                                                page: 1,
                                            }));
                                        }}
                                        className={`px-3 py-2 rounded-lg text-left transition ${active ? "bg-blue-300 text-gray-900" : "bg-white/5 text-white/70 hover:bg-white/10"}`}
                                    >
                                        {cat === "SUPERUSER" ? "Admin" : "Basic"} 
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

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