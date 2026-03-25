import { motion } from "framer-motion";
import ReportPanel from "@/components/admin/admin-report-panel";
import AdminListSection from "./admin-list-section";

/**
 * Renders the user management interface with a list of report and a detail panel.
 * @param {Object} props - Component props.
 * @param {Array} props.users -Array of report objects to display.
 * @param {number} props.totalUsers - Total number of report across all pages.
 * @param {number} props.totalUserPages - Total number of pages available.
 * @param {Function} props.setIsUserFilterOpen - Function to open the report filter modal.
 * @param {Object|null} props.selectedUser - tthe currently selected report for detailed view.
 * @param {Function} props.setSelectedUser - Function to set the selected report.
 * @param {Object} props.filters - Current filter state object.
 * @param {Function} props.setFilters - Function to update filter state.
 * @param {Function} props.resetFilters - Function to reset all filters to default.
 * @returns {JSX.Element} The report management component.
 */
type ReportManagementProps = {
  reports: any[];
  totalReports: number;
  totalReportPages: number;
  currentReportPage: number;
  setCurrentReportPage: React.Dispatch<React.SetStateAction<number>>;
  setIsReportFilterOpen: (open: boolean) => void;
  selectedReport: any;
  setSelectedReport: (report: any) => void;
  fetchReports: () => void;
  filters: any;
  setFilters: (filters: any) => void;
  resetFilters: () => void;
};

export default function ReportManagement({
  reports,
  totalReports,
  totalReportPages,
  setIsReportFilterOpen,
  selectedReport,
  setSelectedReport,
  fetchReports,
  filters,
  setFilters,
  resetFilters,
}: ReportManagementProps) {
	return (
		<AdminListSection
			title="Reports Management"
			items={reports}
			totalItems={totalReports}
			totalPages={totalReportPages}
			filters={filters}
			setFilters={setFilters}
			onFilterOpen={() => setIsReportFilterOpen(true)}
			resetFilters={resetFilters}
			itemLabel="reports"
			renderItem={(report, i) => (
				<motion.div
					key={report.id}
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: i * 0.03 }}
					onClick={() => setSelectedReport(report)}
					className="px-4 py-3 rounded-xl cursor-pointer transition-all hover:bg-white/5 text-white/80"
					>
					<p className="font-medium text-white">ID: {report.id}</p>
					<p className="text-sm text-white/50">Status: {report.status}</p>
				</motion.div>
			)}
			renderPanel={() => (
				<ReportPanel
				report={selectedReport}
				onClose={() => setSelectedReport(null)}
				fetchReports={fetchReports}
				/>
			)}
		/>
	);
}