import AppealPanel from "./admin-appeal-panel";

export default function AppealsManagement({
    appeals,
    totalAppeals,
    totalAppealPages,
    currentAppealPage,
    setCurrentAppealPage,
    setIsAppealFilterOpen,
    selectedAppeal,
    setSelectedAppeal,
    fetchAppeals,
}) {
  return (
    <section className="mb-10 bg-white shadow rounded p-6 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h2 className="text-2xl font-semibold">
          Appeals Management
        </h2>

        {/* need to add in the appeals filter panel if needed
            <button
            type="button"
            onClick={() => setIsAppealFilterOpen(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
            >
            Filter
            </button>
        */}
      </div>

      {/* List */}
      <ul className="space-y-2 flex-1 overflow-y-auto">
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
        {appeals.length !== 0 && (
          <p className="text-sm text-gray-600">
            Showing{" "}
            <span className="font-semibold text-gray-900">
              {appeals.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-900">
              {totalAppeals}
            </span>{" "}
            appeal(s)
          </p>
        )}

        {appeals.length === 0 && (
          <p className="text-sm text-gray-500 mt-4">
            No appeals found.
          </p>
        )}
      </div>

      {/* pagination of the appeals */}
      {totalAppealPages >= 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t flex-shrink-0">
          <button
            disabled={currentAppealPage === 1}
            onClick={() =>
              setCurrentAppealPage((prev) => prev - 1)
            }
            className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <span className="text-sm text-gray-600">
            Page {currentAppealPage} of {totalAppealPages}
          </span>

          <button
            disabled={currentAppealPage === totalAppealPages}
            onClick={() =>
              setCurrentAppealPage((prev) => prev + 1)
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