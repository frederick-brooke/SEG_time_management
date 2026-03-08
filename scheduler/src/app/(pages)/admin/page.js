// pages/admin.js
"use client";

import { useState } from "react";
import UserFilter from "@/components/admin/user-filter-panel";

import ReportFilter from "@/components/admin/report-filter-panel";
import { useUsers } from "@/hooks/useUsers";
import { useAdminReports } from "@/hooks/useAdminReports";
import { useAdminAppeals } from "@/hooks/useAdminAppeals";
import UserManagement from "@/components/admin/userManagement";
import ReportManagement from "@/components/admin/reportManagement";
import AppealsManagement from "@/components/admin/appealManagement";
import AdminStatistics from "@/components/admin/admin-statistics";
import AppealFilter from "@/components/admin/appeal-filter-panel";

export default function AdminPage() {
  //User management states
  const defaultUserFilters = { sortBy: "username", order: "desc", startDate: "", endDate: "", categories: [], page:1, limit: 10};  //user search parameters

  const [appliedUserFilters, setAppliedUserFilters] = useState(defaultUserFilters);
  const [draftUserFilters, setDraftUserFilters] = useState(defaultUserFilters);
  
  function resetUserFilters(){
    setDraftUserFilters(defaultUserFilters);
    setAppliedUserFilters(defaultUserFilters);
  }

  const [selectedUser, setSelectedUser] = useState(null);   //user profile view
  const [isUserFilterOpen, setIsUserFilterOpen] = useState(false);  //search values to be checked and filtered for the usesrs

  //report management
  const [currentReportPage, setCurrentReportPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isReportFilterOpen, setIsReportFilterOpen] = useState(false);

  //report filter states
  const defaultReportFilters = { sortBy:"createdAt", order:"desc", startDate:"", endDate:"", reportStatus:"" };

  const [appliedReportFilters, setAppliedReportFilters] = useState(defaultReportFilters);
  const [draftReportFilters, setDraftReportFilters] = useState(defaultReportFilters);

  const [currentAppealPage, setCurrentAppealPage] = useState(1);
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  
  const defaultAppealFilters = { sortBy:"createdAt", order:"desc", startDate:"", endDate:"", reportStatus:""};
  const [appliedAppealFilters, setAppliedAppealFilters] = useState(defaultAppealFilters);
  const [draftAppealFilters, setDraftAppealFilters] = useState(defaultAppealFilters);

  const [isAppealFilterOpen, setIsAppealFilterOpen] = useState(false);  //open and close the panel

  const {users, totalUserPages, totalUsers, loading} = useUsers(appliedUserFilters, "/api/admin/users");

  const { reports, totalReportPages, totalReports, reportLoading, fetchReports,} = useAdminReports(appliedReportFilters);

  const { appeals, totalAppealPages, totalAppeals, fetchAppeals,} = useAdminAppeals(appliedAppealFilters);

  const [currentTab, setCurrentTab] = useState("reports");  //display the current system, defaults on the reports subsection

  if (loading || reportLoading) {
    return <p className="p-6">Loading...</p>;
  }

  const tabs = {
    reports: (
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
        />
    )
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

        <div>
          {/* tabs header title */}
          <div className="flex border-b mb-4">
            <button
              onClick={() => setCurrentTab("reports")}
              className={`px-4 py-2 font-medium ${
                currentTab === "reports" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500"
              }`}
            >
              Reports
            </button>

            <button
              onClick={() => setCurrentTab("appeals")}
              className={`px-4 py-2 font-medium ${
                currentTab === "appeals" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500"
              }`}
            >
              Appeals
            </button>
          </div>

          {/* render the active tab */}
          {tabs[currentTab]}
        </div>

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
  );
}