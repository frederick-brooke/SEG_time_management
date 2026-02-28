// pages/admin.js
"use client";

import { useState } from "react";
import UserFilter from "@/components/admin/user-filter-panel";

import ReportFilter from "@/components/admin/report-filter-panel";
import { useAdminStats } from "@/hooks/useAdminStats";
import { useAdminReports } from "@/hooks/useAdminReports";
import { useAdminAppeals } from "@/hooks/useAdminAppeals";
import UserManagement from "@/components/admin/userManagement";
import ReportManagement from "@/components/admin/reportManagement";
import AppealsManagement from "@/components/admin/appealManagement";
import { useFilters } from "@/hooks/useFilters";
import AdminStatistics from "@/components/admin/admin-statistics";

export default function AdminPage() {
  //User management states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);   //user profile view
  const [currentUserPage, setCurrentUserPage] = useState(1);
  const [isUserFilterOpen, setIsUserFilterOpen] = useState(false);  //search values to be checked and filtered for the usesrs

  //report management
  const [currentReportPage, setCurrentReportPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isReportFilterOpen, setIsReportFilterOpen] = useState(false);

  //report filter states
  const [reportSortBy, setReportSortBy] = useState("createdAt");
  const [reportOrder, setReportOrder] = useState("desc");
  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");
  const [reportStatus, setReportStatus] = useState("");

  const [currentAppealPage, setCurrentAppealPage] = useState(1);
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");

  const defaultUserFilters = { sortBy: "username", order: "desc", startDate: "", endDate: "", categories: []};  //user search parameters

  const [appliedUserFilters, setAppliedUserFilters] = useState(defaultUserFilters);
  const [draftUserFilters, setDraftUserFilters] = useState(defaultUserFilters);
  
  function resetUserFilters(){
    setDraftUserFilters(defaultUserFilters);
    setAppliedUserFilters(defaultUserFilters);
  }

  const reportFilters = {
    page: currentReportPage,
    sortBy: reportSortBy,
    order: reportOrder,
    startDate: reportStartDate,
    endDate: reportEndDate,
    status: reportStatus,
  };

  const {
    users,
    totalUserPages,
    totalUsers,
    loading
  } = useAdminStats(appliedUserFilters);

  const { reports, totalReportPages, totalReports, reportLoading, fetchReports,} = useAdminReports(reportFilters);

  const { appeals, totalAppealPages, totalAppeals, appealLoading, fetchAppeals,} = useAdminAppeals({
    page: currentAppealPage,
    limit: 10,
    status: selectedStatus,
  });


  if (loading || reportLoading) {
    return <p className="p-6">Loading...</p>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* admin statistics */}
      <AdminStatistics totalUsers={totalUsers} reports={reports} appeals={appeals}/>

      {/* Container for the user reporting system*/}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        <ReportManagement
          reports={reports}
          totalReports={totalReports}
          totalReportPages={totalReportPages}
          currentReportPage={currentReportPage}
          setCurrentReportPage={setCurrentReportPage}
          setIsReportFilterOpen={setIsReportFilterOpen}
          selectedReport={selectedReport}
          setSelectedReport={setSelectedReport}
          fetchReports={fetchReports}
        />

        <AppealsManagement
          appeals={appeals}
          totalAppeals={totalAppeals}
          totalAppealPages={totalAppealPages}
          currentAppealPage={currentAppealPage}
          setCurrentAppealPage={setCurrentAppealPage}
          selectedAppeal={selectedAppeal}
          setSelectedAppeal={setSelectedAppeal}
          fetchAppeals={fetchAppeals}
        />
      </div>
      
      {isUserFilterOpen && (
        <UserFilter 
          filters={draftUserFilters}
          setFilters={setDraftUserFilters}
          onClose={() => setIsUserFilterOpen(false)}
          applyFilters={() => {
            setAppliedUserFilters(draftUserFilters);
            setIsUserFilterOpen(false);
          }}
          resetFilters={() => {
            setAppliedUserFilters(defaultUserFilters);
          }}              
        />
      )} 
        
      {isReportFilterOpen && (
        <ReportFilter 
          sortBy={reportSortBy} setSortBy={setReportSortBy} 
          order={reportOrder} setOrder={setReportOrder} 
          startDate={reportStartDate} setStartDate={setReportStartDate} 
          endDate={reportEndDate} setEndDate={setReportEndDate}
          status={reportStatus} setStatus={setReportStatus}
          onClose={() => setIsReportFilterOpen(false)}
        />
      )} 
    </div>
  );
}