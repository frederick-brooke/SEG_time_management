import AppealPanel from "./admin-appeal-panel";

import { motion } from "framer-motion";

export default function AppealsManagement({appeals, totalAppeals, totalAppealPages, currentAppealPage, setCurrentAppealPage, selectedAppeal, setSelectedAppeal, fetchAppeals, setIsAppealFilterOpen, filters, setFilters, resetFilters}) {
  const PAGE_SIZE = filters?.limit ?? 5;
  const page = filters?.page ?? 1;

  const start = appeals.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;

  const end = appeals.length === 0 ? 0 : start + appeals.length - 1;

  return (
    <section className="mb-6 flex flex-col h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h2 className="text-xl text-white font-semibold">
          Appeals Management
        </h2>

        {/* appeal filter button */}
        <button
            type="button"
            onClick={() => setIsAppealFilterOpen(true)}
            className="px-4 py-2 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 transition"
        >
            Filter
        </button>
        
      </div>

      {/* List */}
      <ul className="space-y-2 flex-1 overflow-y-auto min-h-0 pr-1">
        {appeals.map((appeal, i) => (
          <motion.div
            key={appeal.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => setSelectedAppeal(appeal)}
            className="px-4 py-3 rounded-xl cursor-pointer transition-all hover:bg-white/5 text-white/80"
          >
            <div>
              <p className="font-medium text-white">
                Appeal ID: {appeal.id}
              </p>

              <p className="text-sm text-white">
                User: {appeal.user?.email}
              </p>

              <p className="text-sm text-gray-500">
                Status: {appeal.status}
              </p>
            </div>
          </motion.div>
        ))}
      </ul>

      {/* Count Display (same as reports) */}
      <div className="mt-4 flex justify-center flex-shrink-0">
          {appeals.length !== 0 ? (
              <p className="text-sm text-white/60">
                Showing{" "}
              <span className="font-semibold text-white">
                  {start}-{end}
              </span>{" "}
                of{" "}
              <span className="font-semibold text-white">
                  {totalAppeals}
              </span>{" "}
                appeals
              </p>
          ) : (
              <p className="text-sm text-white/40 mt-4">
                No appeals found.
              </p>
          )}
      </div>

      {/* pagination of the appeals */}
      {totalAppealPages >= 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10 flex-shrink-0">
          <button
            disabled={page === 1}
            onClick={() =>
              setFilters(prev => ({
                ...prev,
                page: (prev.page ?? 1) - 1
              }))
            }
            className="px-3 py-1 border rounded-lg bg-white/5 text-white/70 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <span className="text-sm text-white-600">
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
            className="px-3 py-1 border rounded-lg bg-white/5 text-white/70 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
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