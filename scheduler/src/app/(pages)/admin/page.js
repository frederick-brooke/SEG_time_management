// pages/admin.js
"use client";

import { useState, useEffect } from "react";
import UserPanel from "@/components/admin-user-panel";
import UserFilter from "@/components/user-filter-panel";
import ReportPanel from "@/components/admin-report-panel";
import ReportFilter from "@/components/report-filter-panel";

export default function AdminPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null); //user profile view

  const [currentUserPage, setCurrentUserPage] = useState(1);

  //search values to be checked and filtered for the usesrs
  const [sortBy, setSortBy] = useState("username");
  const [order, setOrder] = useState("asc");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [categories, setCategories] = useState([]);

  const [isUserFilterOpen, setIsUserFilterOpen] = useState(false);

  const [reports, setReports] = useState([]); //track if reports get rendered
  const [reportLoading, setReportLoading] = useState(true);
  const [totalReportPages, setTotalReportPages] = useState(1);
  const [currentReportPage, setCurrentReportPage] = useState(1);
  const [totalReports, setTotalReports] = useState(null);

  const [selectedReport, setSelectedReport] = useState(null);
  const [isReportFilterOpen, setIsReportFilterOpen] = useState(false);

  const [reportSortBy, setReportSortBy] = useState("createdAt");
  const [reportOrder, setReportOrder] = useState("desc");
  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");
  const [reportStatus, setReportStatus] = useState("");

  const [stats, setStats] = useState(null);   //for users
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
    fetchReports();
  }, [currentUserPage, currentReportPage, searchQuery, sortBy, order, startDate, endDate, categories, reportSortBy,reportOrder, reportStartDate, reportEndDate, reportStatus]);

  async function fetchUsers(){
    try {
      //setLoading(true); //reset the search on every keystroke infut
      const query = new URLSearchParams({
        search: searchQuery || "",
        sortBy: sortBy || "",
        order: order || "",
        page: currentUserPage.toString(),
        limit: "10",
        startDate: startDate || "",
        endDate: endDate || "",
        categories: categories.length ? categories.join(",") : "",
      });

      const res = await fetch(
        `/api/admin/users?${query.toString()}`
      );

      if(!res.ok){
        const err = await res.json();
        console.log("API error:", err);
        return;
      }

      const data = await res.json();
      setStats(data);
      setLoading(false);
    } catch (err){
      setLoading(false);
    }
  }

  async function fetchReports() {
    try {
      setReportLoading(true);

      const query = new URLSearchParams({
        page: currentReportPage.toString(),
        limit: "10",
        sortBy: reportSortBy,
        order: reportOrder,
        startDate: reportStartDate || "",
        endDate: reportEndDate || "",
        status: reportStatus || "",
      });

      const res = await fetch(`/api/admin/reports?${query.toString()}`);

      if (!res.ok) {
        console.log("Failed to fetch reports");
        return;
      }

      const data = await res.json();

      setReports(data.reports);
      setReportLoading(false);
      setTotalReportPages(data.totalPages);
      setTotalReports(data.totalMatchingReports);
      console.log("Total Number of Report Pages" + totalReportPages)
    } catch (err) {
      console.error(err);
      setReportLoading(false);
    }
  }

  if(loading){
    return <p className="p-6">Loading</p>;
  }

  const users = stats?.users ?? [];
  const totalUsers = stats?.totalUsers ?? "-";

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* Statistics */}
      <section className="bg-white shadow rounded p-6 mb-4">
        <h2 className="text-2xl font-semibold mb-4">Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-100 p-4 rounded text-center">
            <p className="text-xl font-bold">
              {totalUsers}
            </p>
            <p>Total Users</p>
          </div>
          <div className="bg-yellow-100 p-4 rounded text-center">
            <p className="text-xl font-bold">
              {reports.filter(report => report.status === "PENDING").length}
            </p>
            <p>Active Reports</p>
          </div>
          <div className="bg-red-100 p-4 rounded text-center">
            <p className="text-xl font-bold">
              {reports.length}
            </p>
            <p>Total Reports</p>
          </div>
        </div>
      </section>

      {/* Container for the user reporting system*/}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Management */}
        <section className="mb-4 bg-white shadow rounded p-6">
          <h2 className="text-2xl font-semibold mb-4">User Management</h2>
          
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setCurrentUserPage(1);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border rounded px-3 py-2 max-w-sm"
            />

            <button
              type="submit"
              className="ml-2 bg-blue-500 text-white px-4 py-2 rounded"
            >
              Search
            </button>

            <button
              type="button"
              className="ml-2 bg-blue-500 text-white px-4 py-2 rounded"
              onClick={() => setIsUserFilterOpen(true)}
            >
              Filter
            </button>
          </form>
         
          <div className="space-y-2 flex-1 overflow-y-auto">
            {users.map((user) => (
                <div key={user.id} 
                onClick={() => setSelectedUser(user)}
                className="border-b py-1 cursor-pointer">
                  {user.username}
                </div>
              ))}
          </div>

          <div className="mt-4 flex justify-center">
            {users.length !== 0 && (
              <p className="text-sm text-gray-600">
                Showing{" "}
              <span className="font-semibold text-gray-900">
                {users.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-900">
                {stats?.totalMatchingUsers ?? 0}
              </span>{" "}
                users
              </p>
            )}           

            {users.length === 0 && (
              <p className="text-sm text-gray-500 mt-4">
                No users found.
              </p>
            )}
          </div>

          {stats?.totalPages >= 1 && (
            <div className="flex items-center justify-between mt-4 border-t flex-shrink-0">
              <button
                disabled={currentUserPage === 1}
                onClick={() => setCurrentUserPage((prev) => prev - 1)}
                className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <span className="text-sm text-gray-600">
                Page {currentUserPage} of {stats.totalPages}
              </span>

              <button
                disabled={currentUserPage === stats.totalPages}
                onClick={() => setCurrentUserPage((prev) => prev + 1)}
                className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </section>

        {/* Reports Management */}
        <section className="mb-10 bg-white shadow rounded p-6 flex flex-col">
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
          
          <ul className="space-y-2 flex-1 overflow-y-auto">
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

          <div className="mt-4 flex justify-center">
            {reports.length !== 0 && (
              <p className="text-sm text-gray-600">
                Showing{" "}
              <span className="font-semibold text-gray-900">
                {reports.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-900">
                {totalReports ?? 0}
              </span>{" "}
                users
              </p>
            )}           

            {users.length === 0 && (
              <p className="text-sm text-gray-500 mt-4">
                No users found.
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
        </section>
      </div>

      <UserPanel user={selectedUser} onClose={() => setSelectedUser(null)}/>
      
      {isUserFilterOpen && (
        <UserFilter sortBy={sortBy} setSortBy={setSortBy} 
          order={order} setOrder={setOrder} 
          onClose={() => setIsUserFilterOpen(false)} 
          startDate={startDate} setStartDate={setStartDate} 
          endDate={endDate} setEndDate={setEndDate}
          categories={categories} setCategories={setCategories}
        />
      )} 

      <ReportPanel report={selectedReport} onClose={() => setSelectedReport(null)} fetchReports={fetchReports}/>
        
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
