import ReportPanel from "@/components/admin/admin-report-panel";

import { motion } from "framer-motion";

export default function ReportManagement({reports, totalReports, totalReportPages, currentReportPage, setCurrentReportPage,setIsReportFilterOpen, selectedReport, setSelectedReport, fetchReports, filters, setFilters, resetFilters}){
    const max_reports = filters?.limit ?? 12;
    const page = filters?.page ?? 1;

    const start =reports.length === 0 ? 0 : (page - 1) * max_reports + 1;

    const end = reports.length === 0 ? 0 : start + reports.length - 1;

    return(
        <section className="mb-6 flex flex-col h-[600px]">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
                {/*Header with name and filtering button */}
                <h2 className="text-xl text-white font-semibold">
                    Reports Management
                </h2>

                <button
                    type="button"
                    onClick={() => setIsReportFilterOpen(true)}
                    className="px-4 py-2 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 transition"
                >
                    Filter
                </button>
            </div>
            
            <ul className="space-y-2 flex-1 overflow-y-auto min-h-0 pr-1ed">
                {reports.map((report, i) => (
                    <motion.div
                        key={report.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => setSelectedReport(report)}
                        className="px-4 py-3 rounded-xl cursor-pointer transition-all hover:bg-white/5 text-white/80"
                    >
                        <p className="font-medium text-white">
                        ID: {report.id}
                        </p>

                        <p className="text-sm text-white/50">
                        Status: {report.status}
                        </p>
                    </motion.div>
                ))}
            </ul>

            {/* Count Display (same as users) */}
            <div className="mt-4 flex justify-center flex-shrink-0">
                {reports.length !== 0 ? (
                    <p className="text-sm text-white/60">
                        Showing{" "}
                    <span className="font-semibold text-white">
                        {start}-{end}
                    </span>{" "}
                        of{" "}
                    <span className="font-semibold text-white">
                        {totalReports}
                    </span>{" "}
                        reports
                    </p>
                ) : (
                    <p className="text-sm text-white/40 mt-4">
                        No reports found.
                    </p>
                )}
            </div>

            {totalReportPages >= 1 && (
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

                    <span className="text-sm text-white-60">
                        Page {page} of {totalReportPages}
                    </span>

                    <button
                        disabled={page === totalReportPages}
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
        <ReportPanel report={selectedReport} onClose={() => setSelectedReport(null)} fetchReports={fetchReports}/>
    </section>
)}