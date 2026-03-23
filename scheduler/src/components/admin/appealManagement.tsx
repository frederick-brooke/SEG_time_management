import { motion } from "framer-motion";
import AppealPanel from "./admin-appeal-panel";
import AdminListSection from "./admin-list-section";

/**
 * Renders the appeals management interface with an animated list of appeals and a detail panel.
 * @param {Object} props - Component props.
 * @param {Array} props.appeals - Array of appeal objects to display.
 * @param {number} props.totalAppeals - Total number of appeals across all pages.
 * @param {number} props.totalAppealPages - Total number of pages available.
 * @param {Object|null} props.selectedAppeal - The currently selected appeal for detailed view.
 * @param {Function} props.setSelectedAppeal - Function to set the selected appeal.
 * @param {Function} props.fetchAppeals - Function to refetch the appeals list.
 * @param {Function} props.setIsAppealFilterOpen - Function to open the appeal filter modal.
 * @param {Object} props.filters - Current filter state object.
 * @param {Function} props.setFilters - Function to update filter state.
 * @param {Function} props.resetFilters - Function to reset all filters to default.
 * @returns {JSX.Element} The appeals management component.
 */
interface appealManagementProps {
  appeals: any[];
  totalAppeals: number;
  totalAppealPages: number;
  currentAppealPage: number;
  setCurrentAppealPage: React.Dispatch<React.SetStateAction<number>>;
  selectedAppeal: any;
  setSelectedAppeal: (appeal: any) => void;
  fetchAppeals: () => void;
  setIsAppealFilterOpen: (open: boolean) => void;
  filters: any;
  setFilters: (filters: any) => void;
  resetFilters: () => void;
}


export default function AppealsManagement({
  appeals,
  totalAppeals,
  totalAppealPages,
  currentAppealPage,
  setCurrentAppealPage,
  selectedAppeal,
  setSelectedAppeal,
  fetchAppeals,
  setIsAppealFilterOpen,
  filters,
  setFilters,
  resetFilters,
}: appealManagementProps) {
  return (
    <AdminListSection
      title="Appeals Management"
      items={appeals}
      totalItems={totalAppeals}
      totalPages={totalAppealPages}
      filters={filters}
      setFilters={setFilters}
      onFilterOpen={() => setIsAppealFilterOpen(true)}
      resetFilters={resetFilters}
      itemLabel="appeals"
      renderItem={(appeal, i) => (
        <motion.div
          key={appeal.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03 }}
          onClick={() => setSelectedAppeal(appeal)}
          className="px-4 py-3 rounded-xl cursor-pointer transition-all hover:bg-white/5 text-white/80"
        >
          <p className="font-medium text-white">Appeal ID: {appeal.id}</p>
          <p className="text-sm text-white">User: {appeal.user?.email}</p>
          <p className="text-sm text-gray-500">Status: {appeal.status}</p>
        </motion.div>
      )}
      renderPanel={() => (
        <AppealPanel
          appeal={selectedAppeal}
          onClose={() => setSelectedAppeal(null)}
          fetchAppeals={fetchAppeals}
        />
      )}
    />
  );
}