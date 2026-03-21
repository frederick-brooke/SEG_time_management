import UserPanel from "@/components/admin/admin-user-panel";
import AdminListSection from "./admin-list-section";

/**
*Renders the user management interface with a list of users and a detail panel.
*@param {Object} props - Component props.
*@param {Array} props.users - Array of user objects to display.
*@param {number} props.totalUsers - Total number of users across all pages.
*@param {number} props.totalUserPages - Total number of pages available.
*@param {Function} props.setIsUserFilterOpen - Function to open the user filter modal.
*@param {Object|null} props.selectedUser - The currently selected user for detailed view.
*@param {Function} props.setSelectedUser - Function to set the selected user.
*@param {Object} props.filters - Current filter state object.
*@param {Function} props.setFilters - Function to update filter state.
*@param {Function} props.resetFilters - Function to reset all filters to default.
*@return {JSX.Element} The user management component.
*/
export default function UserManagement({
  users,
  totalUsers,
  totalUserPages,
  setIsUserFilterOpen,
  selectedUser,
  setSelectedUser,
  filters,
  setFilters,
  resetFilters,
}) {
  return (
    <AdminListSection
      title="User Management"
      items={users}
      totalItems={totalUsers}
      totalPages={totalUserPages}
      filters={filters}
      setFilters={setFilters}
      onFilterOpen={() => setIsUserFilterOpen(true)}
      resetFilters={resetFilters}
      itemLabel="users"
      searchable
      renderItem={(user) => (
        <li
          key={user.id}
          onClick={() => setSelectedUser(user)}
          className={`px-3 py-2 rounded-lg cursor-pointer transition-all ${
            user.isBanned
              ? "bg-red-100/10 text-red-300"
              : "text-white hover:bg-white/20"
          }`}
        >
          {user.username}
        </li>
      )}
      renderPanel={() => (
        <UserPanel
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    />
  );
}