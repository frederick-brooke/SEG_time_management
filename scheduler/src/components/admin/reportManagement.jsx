import ReportPanel from "@/components/admin/admin-report-panel";
import ReportFilter from "@/components/admin/report-filter-panel";
import { report } from "node:process";

export default function ReportManagement({reports, totalReports, totalReportPages, currentReportPage, setCurrentReportPage,setIsReportFilterOpen, selectedReport, setSelectedReport, fetchReports, filters, setFilters, resetFilters}){
    const max_reports = 5;
    const page = filters?.page ?? 1;

    const start =reports.length === 0 ? 0 : (page - 1) * max_reports + 1;

    const end =reports.length === 0 ? 0 : Math.min((page - 1) * max_reports + reports.length, totalReports);

    return(
        <section className="mb-10 bg-white shadow rounded p-6 flex flex-col h-[600px]">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
                {/*Header with name and filtering button */}
                <h2 className="text-2xl font-semibold">
                    Reports Management
                </h2>

                <button
                    type="button"
                    onClick={() => setIsReportFilterOpen(true)}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                >
                    Filter
                </button>
            </div>
            
                <ul className="space-y-2 flex-1 overflow-y-auto min-h-0">
                {reports.map((report) => (
                    <li
                    key={report.id}
                    onClick={() => setSelectedReport(report)}
                    className="border p-3 rounded flex justify-between cursor-pointer items-center"
                    >
                    <div>
                        <p className="font-medium">
                        ID: {report.id}
                        </p>

                        <p className="text-sm text-gray-500">
                        Status: {report.status}
                        </p>
                    </div>
                    </li>
                ))}
                </ul>

                {/* Count Display (same as users) */}
                <div className="mt-4 flex justify-center">
                    {reports.length !== 0 ? (
                        <p className="text-sm text-gray-600">
                            Showing{" "}
                        <span className="font-semibold text-gray-900">
                            {start}-{end}
                        </span>{" "}
                            of{" "}
                        <span className="font-semibold text-gray-900">
                            {totalReports}
                        </span>{" "}
                            reports
                        </p>
                    ) : (
                        <p className="text-sm text-gray-500 mt-4">
                            No reports found.
                        </p>
                    )}
                </div>

                {totalReportPages >= 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t flex-shrink-0">
                        <button
                        disabled={currentReportPage === 1}
                        onClick={() =>
                            setCurrentReportPage((prev) => prev - 1)
                        }
                        className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                        Previous
                        </button>

                        <span className="text-sm text-gray-600">
                        Page {currentReportPage} of {totalReportPages}
                        </span>

                        <button
                        disabled={currentReportPage === totalReportPages}
                        onClick={() =>
                            setCurrentReportPage((prev) => prev + 1)
                        }
                        className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                        Next
                        </button>
                    </div>
                )}

        <ReportPanel report={selectedReport} onClose={() => setSelectedReport(null)} fetchReports={fetchReports}/>
    </section>
)}