// pages/admin.js
"use client";

import { useState, useEffect } from "react";
import UserPanel from "@/components/admin-user-panel";
import UserFilter from "@/components/user-filter-panel";
import ReportPanel from "@/components/admin-report-panel";
export default function AdminPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null); //user profile view

  const [currentUserPage, setCurrentUserPage] = useState(1);

  //search values to be checked and filtered
  const [sortBy, setSortBy] = useState("username");
  const [order, setOrder] = useState("asc");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [categories, setCategories] = useState([]);

  const [isUserFilterOpen, setIsUserFilterOpen] = useState(false);

  const [reports, setReports] = useState([]); //track if reports get rendered
  const [reportLoading, setReportLoading] = useState(true);

  const [selectedReport, setSelectedReport] = useState(null);

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
    fetchReports();
  }, [currentUserPage, searchQuery, sortBy, order, startDate, endDate, categories]);

  console.log("Categories state:", categories);

  async function fetchUsers(){
    try {
      //setLoading(true); //reset the search on every keystroke infut
      const query = new URLSearchParams({
        search: searchQuery, sortBy, order, page: currentUserPage,
        limit: 10, startDate, endDate,
        categories: categories.join(","),
      });

      console.log(query.toString());
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

      const res = await fetch("/api/admin/reports");

      if (!res.ok) {
        console.log("Failed to fetch reports");
        return;
      }

      const data = await res.json();
      setReports(data.reports);
      setReportLoading(false);
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
         
          <div className="space-y-2">
            {users.map((user) => (
                <div key={user.id} 
                onClick={() => setSelectedUser(user)}
                className="border-b py-1 cursor-pointer">
                  {user.username}
                </div>
              ))}
          </div>

          <div className="mt-4">
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

          {stats?.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
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
        <section className="mb-10 bg-white shadow rounded p-6">
          <h2 className="text-2xl font-semibold mb-4">Reports Management</h2>
          <ul className="space-y-2">
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

      <ReportPanel report={selectedReport} onClose={() => setSelectedReport(null)}/>
        
    </div>
  );
}
