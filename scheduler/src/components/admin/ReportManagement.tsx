import { motion } from "framer-motion";
import ReportPanel from "@/components/admin/AdminReportPanel";
import AdminListSection from "./AdminListSection";

type ReportManagementProps = {
  reports: any[];
  totalReports: number;
  totalReportPages: number;
  setIsReportFilterOpen: (open: boolean) => void;
  selectedReport: any;
  setSelectedReport: (report: any) => void;
  fetchReports: () => void;
  filters: any;
  setFilters: (filters: any) => void;
  resetFilters: () => void;
};

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
				<ReportListItem key={report.id} report={report} index={i} onSelect={setSelectedReport}/>
			)}
			renderPanel={() => (
				<ReportPanelWrapper selectedReport={selectedReport} setSelectedReport={setSelectedReport} fetchReports={fetchReports}/>
			)}
		/>
	);
}

/**
*Renders an individual report item in the list with animation.
*@param {Object} props.report - The report data object.
*@param {number} props.index - The index for animation delay.
*@param {Function} props.onSelect - Callback when report is selected.
*@returns {JSX.Element} The report list item component.
*/
function ReportListItem({ report, index, onSelect }) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: index * 0.03 }}
			onClick={() => onSelect(report)}
			className="px-4 py-3 rounded-xl cursor-pointer transition-all hover:bg-white/5 text-white/80"
		>
			<p className="font-medium text-white">ID: {report.id}</p>
			<p className="text-sm text-white/50">
				Status: {report.status}
			</p>
		</motion.div>
	);
}

/**
*Wrapper component that renders the ReportPanel with pre-configured props.
*@param {Object|null} props.selectedReport - The currently selected report.
*@param {Function} props.setSelectedReport - Function to clear selected report.
*@param {Function} props.fetchReports - Function to refetch reports list.
*@returns {JSX.Element} The report panel wrapper component.
*/
function ReportPanelWrapper({
	selectedReport,
	setSelectedReport,
	fetchReports,
}) {
	return (
		<ReportPanel report={selectedReport} onClose={() => setSelectedReport(null)} fetchReports={fetchReports}/>
	);
}