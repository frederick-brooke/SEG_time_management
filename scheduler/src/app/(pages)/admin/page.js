// pages/admin.js
"use client";

import { useState } from "react";
import UserFilter from "@/components/user-filter-panel";

import ReportFilter from "@/components/report-filter-panel";
import { useAdminStats } from "@/hooks/useAdminStats";
import { useAdminReports } from "@/hooks/useAdminReports";
import { useAdminAppeals } from "@/hooks/useAdminAppeals";
import UserManagement from "@/components/admin/userManagement";
import ReportManagement from "@/components/admin/reportManagement";
import AppealsManagement from "@/components/admin/appealManagement";

export default function AdminPage() {
  //User management states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);   //user profile view
  const [currentUserPage, setCurrentUserPage] = useState(1);
  const [isUserFilterOpen, setIsUserFilterOpen] = useState(false);  //search values to be checked and filtered for the usesrs

  //user search parameters
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState("desc");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [categories, setCategories] = useState([]);

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

  const userFilters = {
    search: searchQuery,
    page: currentUserPage,
    sortBy,
    order,
    startDate,
    endDate,
    categories,
  };

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
  } = useAdminStats(userFilters);

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

      {/* Container for the user reporting system*/}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <UserManagement
          users={users}
          totalUsers={totalUsers}
          totalUserPages={totalUserPages}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          currentUserPage={currentUserPage}
          setCurrentUserPage={setCurrentUserPage}
          setIsUserFilterOpen={setIsUserFilterOpen}
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
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
        <UserFilter sortBy={sortBy} setSortBy={setSortBy} 
          order={order} setOrder={setOrder} 
          onClose={() => setIsUserFilterOpen(false)} 
          startDate={startDate} setStartDate={setStartDate} 
          endDate={endDate} setEndDate={setEndDate}
          categories={categories} setCategories={setCategories}
        />
      )} 
        
      {isReportFilterOpen && (
        <ReportFilter sortBy={reportSortBy} setSortBy={setReportSortBy} 
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