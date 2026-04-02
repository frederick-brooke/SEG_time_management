"use client";

/**
 * Admin dashboard for managing users, reports, and appeals.
 * Includes filtering, pagination, and tabbed views.
 */

import { useState } from "react";
import UserFilter from "@/components/admin/UserFilterPanel";
import ReportFilter from "@/components/admin/ReportFilterPanel";
import { useUsers } from "@/hooks/useUsers";
import { useAdminReports } from "@/hooks/useAdminReports";
import { useAdminAppeals } from "@/hooks/useAdminAppeals";
import UserManagement from "@/components/admin/UserManagement";
import ReportManagement from "@/components/admin/ReportManagement";
import AppealsManagement from "@/components/admin/AppealManagement";
import AdminStatistics from "@/components/admin/AdminStatistics";
import AppealFilter from "@/components/admin/AppealFilterPanel";

// UI components
import StarField from "@/components/effects/StarField";
import GlowBackground from "@/components/ui/GlowBackground";
import GlassCard from "@/components/ui/GlassCard";
import { motion } from "framer-motion";
import LunarThemeWrapper from "@/components/layout/LunarThemeWrapper";
import { Button } from "@/components/ui/Button";

/**
 * Main admin dashboard component managing users, reports, and appeals with filtering and pagination.
 * @param {Object} props - Component props.
 * @returns {JSX.Element} The admin dashboard page.
 */
export default function AdminPage() {
  // User management states
  const defaultUserFilters = { sortBy: "username", order: "desc", startDate: "", endDate: "", categories: [], page:1, limit: 10};  //user search parameters
  const [appliedUserFilters, setAppliedUserFilters] = useState(defaultUserFilters);
  const [draftUserFilters, setDraftUserFilters] = useState(defaultUserFilters);
  
  function resetUserFilters(){
    setDraftUserFilters(defaultUserFilters);
    setAppliedUserFilters(defaultUserFilters);
  }

  const [selectedUser, setSelectedUser] = useState(null);   
  const [isUserFilterOpen, setIsUserFilterOpen] = useState(false);  

  // Report management
  const [selectedReport, setSelectedReport] = useState(null);
  const [isReportFilterOpen, setIsReportFilterOpen] = useState(false);

  // Report filter states
  const defaultReportFilters = { sortBy:"createdAt", order:"desc", startDate:"", endDate:"", reportStatus:"", limit:12, page:1 };
  const [appliedReportFilters, setAppliedReportFilters] = useState(defaultReportFilters);
  const [draftReportFilters, setDraftReportFilters] = useState(defaultReportFilters);

  function resetReportFilters(){
    setDraftReportFilters(defaultReportFilters);
    setAppliedReportFilters(defaultReportFilters);
  }

  const [currentAppealPage, setCurrentAppealPage] = useState(1);
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const defaultAppealFilters = { sortBy:"createdAt", order:"desc", startDate:"", endDate:"", reportStatus:"", limit:12};
  const [appliedAppealFilters, setAppliedAppealFilters] = useState(defaultAppealFilters);
  const [draftAppealFilters, setDraftAppealFilters] = useState(defaultAppealFilters);
  const [isAppealFilterOpen, setIsAppealFilterOpen] = useState(false);  

  function resetAppealFilters(){
    setDraftAppealFilters(defaultAppealFilters);
    setAppliedAppealFilters(defaultAppealFilters);
  }

  const {users, totalUserPages, totalUsers, loading} = useUsers(appliedUserFilters, "/api/admin/users");
  const { reports, totalReportPages, totalReports, reportLoading, fetchReports,} = useAdminReports(appliedReportFilters);
  const { appeals, totalAppealPages, totalAppeals, fetchAppeals,} = useAdminAppeals(appliedAppealFilters);

  const [currentTab, setCurrentTab] = useState("reports");  // Display the current system, defaults on the reports subsection

  if (loading || reportLoading) {
    return <p className="p-6">Loading...</p>;
  }
  
  // Tabulated access allows for different views to appear on each tab
  const tabs: Record<string, React.ReactNode> = {
    reports: (
      <ReportManagement
        reports={reports}
        totalReports={totalReports}
        totalReportPages={totalReportPages}
        setIsReportFilterOpen={setIsReportFilterOpen}
        selectedReport={selectedReport}
        setSelectedReport={setSelectedReport}
        fetchReports={fetchReports}
        filters={appliedReportFilters}
        setFilters={setAppliedReportFilters}
        resetFilters={resetReportFilters}
      />
    ),

    appeals: (
      <AppealsManagement
          appeals={appeals}
          totalAppeals={totalAppeals}
          totalAppealPages={totalAppealPages}
          currentAppealPage={currentAppealPage}
          setCurrentAppealPage={setCurrentAppealPage}
          selectedAppeal={selectedAppeal}
          setSelectedAppeal={setSelectedAppeal}
          fetchAppeals={fetchAppeals}
          setIsAppealFilterOpen={setIsAppealFilterOpen}
          filters={appliedAppealFilters}
          setFilters={setAppliedAppealFilters}
          resetFilters={resetAppealFilters}
        />
    )
  }

  return (
    <LunarThemeWrapper>
      <div className="min-h-screen bg-gray-950 text-white relative">
        <h1 className="lunar-page-title">
          Admin Dashboard
        </h1>

        {/* Background effects */}
        <StarField density={100} />
        <GlowBackground />

        {/* Admin statistics */}
        <AdminStatistics/>

            {/* Container for the user reporting system */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <GlassCard>
                  <UserManagement
                    users={users}
                    totalUsers={totalUsers}
                    totalUserPages={totalUserPages}
                    setIsUserFilterOpen={setIsUserFilterOpen}
                    selectedUser={selectedUser}
                    setSelectedUser={setSelectedUser}
                    filters={appliedUserFilters}
                    setFilters={setAppliedUserFilters}
                    resetFilters={resetUserFilters}
                  />
                </GlassCard>

              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0}}
              >
                <GlassCard>
                  {/* Tabs header title */}
                  <div className="flex border-b mb-4">
                    <Button
                      onClick={() => setCurrentTab("reports")}
                      className={`lunar-page-subtitle px-4 py-2 font-medium ${
                        currentTab === "reports" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500"
                      }`}
                    >
                      Reports
                    </Button>

                    <Button
                      onClick={() => setCurrentTab("appeals")}
                      className={`lunar-page-subtitle px-4 py-2 font-medium ${
                        currentTab === "appeals" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500"
                      }`}
                    >
                      Appeals
                    </Button>
                  </div>

                  {/* Render the active tab */}
                  {tabs[currentTab]}
                </GlassCard>
                
              </motion.div>

            </div>

            {/* Respective filter panels */}
            {isUserFilterOpen && (
              <UserFilter 
                filters={draftUserFilters}
                setFilters={setDraftUserFilters}
                onClose={() => setIsUserFilterOpen(false)}
                applyFilters={() => {
                  setAppliedUserFilters(prev => ({
                    ...prev,
                    ...draftUserFilters,
                    page: 1
                  }));
                  setIsUserFilterOpen(false);
                }}
                resetFilters={() => {
                  setAppliedUserFilters(defaultUserFilters);
                }} 
                type={"admin"}      
              />
            )} 
              
            {isReportFilterOpen && (
              <ReportFilter 
                filters={draftReportFilters}
                setFilters={setDraftReportFilters}
                onClose={() => setIsReportFilterOpen(false)}
                  applyFilters={() => {
                    setAppliedReportFilters(draftReportFilters);
                    setIsReportFilterOpen(false);
                  }}
                  resetFilters={() => {
                    setAppliedReportFilters(defaultReportFilters);
                  }}
              />
            )} 

            {isAppealFilterOpen && (
              <AppealFilter
                filters={draftAppealFilters}
                setFilters={setDraftAppealFilters}
                onClose={() => setIsAppealFilterOpen(false)}
                  applyFilters={() => {
                    setAppliedAppealFilters(draftAppealFilters);
                    setIsAppealFilterOpen(false);
                  }}
                  resetFilters={() => {
                    setAppliedAppealFilters(defaultAppealFilters);
                  }}
              />
            )}
          </div>
    </LunarThemeWrapper>
  );
}