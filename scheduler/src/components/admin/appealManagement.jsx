import AppealPanel from "./admin-appeal-panel";

export default function AppealsManagement({appeals, totalAppeals, totalAppealPages, currentAppealPage, setCurrentAppealPage, selectedAppeal, setSelectedAppeal, fetchAppeals, setIsAppealFilterOpen, filters, setFilters, resetFilters}) {
  const PAGE_SIZE = filters?.limit ?? 5;
  const page = filters?.page ?? 1;

  const start = appeals.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;

  const end = appeals.length === 0 ? 0 : start + appeals.length - 1;

  return (
    <section className="mb-10 bg-white shadow rounded p-6 flex flex-col h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h2 className="text-2xl font-semibold">
          Appeals Management
        </h2>

        {/* appeal filter button */}
        <button
            type="button"
            onClick={() => setIsAppealFilterOpen(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
        >
            Filter
        </button>
        
      </div>

      {/* List */}
      <ul className="space-y-2 flex-1 overflow-y-auto min-h-0">
        {appeals.map((appeal) => (
          <li
            key={appeal.id}
            onClick={() => setSelectedAppeal(appeal)}
            className="border p-3 rounded flex justify-between cursor-pointer items-center"
          >
            <div>
              <p className="font-medium">
                Appeal ID: {appeal.id}
              </p>

              <p className="text-sm text-gray-500">
                User: {appeal.user?.email}
              </p>

              <p className="text-sm text-gray-500">
                Status: {appeal.status}
              </p>
            </div>
          </li>
        ))}
      </ul>

      {/* Count Display (same as reports) */}
      <div className="mt-4 flex justify-center">
          {appeals.length !== 0 ? (
              <p className="text-sm text-gray-600">
                Showing{" "}
              <span className="font-semibold text-gray-900">
                  {start}-{end}
              </span>{" "}
                of{" "}
              <span className="font-semibold text-gray-900">
                  {totalAppeals}
              </span>{" "}
                appeals
              </p>
          ) : (
              <p className="text-sm text-gray-500 mt-4">
              No appeals found.
              </p>
          )}
      </div>

      {/* pagination of the appeals */}
      {totalAppealPages >= 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t flex-shrink-0">
          <button
            disabled={page === 1}
            onClick={() =>
              setFilters(prev => ({
                ...prev,
                page: (prev.page ?? 1) - 1
              }))
            }
            className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <span className="text-sm text-gray-600">
            Page {currentAppealPage} of {totalAppealPages}
          </span>

          <button
            disabled={page === totalAppealPages}
            onClick={() =>
              setFilters(prev => ({
                ...prev,
                page: (prev.page ?? 1) + 1
              }))
            }
            className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      <AppealPanel
        appeal={selectedAppeal}
        onClose={() => setSelectedAppeal(null)}
        fetchAppeals={fetchAppeals}
      />
    </section>
  );
}