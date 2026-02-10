// pages/admin.js
"use client";

import { useState } from "react";

export default function AdminPage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data
  const users = ["Alice", "Bob", "Charlie", "David"];
  const reports = [
    { id: 1, title: "Spam message", status: "Pending" },
    { id: 2, title: "Offensive content", status: "Reviewed" },
  ];

  const stats = {
    totalUsers: users.length,
    activeReports: reports.filter(r => r.status === "Pending").length,
    totalReports: reports.length,
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* Statistics */}
      <section className="bg-white shadow rounded p-6 mb-4">
        <h2 className="text-2xl font-semibold mb-4">Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-100 p-4 rounded text-center">
            <p className="text-xl font-bold">{stats.totalUsers}</p>
            <p>Total Users</p>
          </div>
          <div className="bg-yellow-100 p-4 rounded text-center">
            <p className="text-xl font-bold">{stats.activeReports}</p>
            <p>Active Reports</p>
          </div>
          <div className="bg-red-100 p-4 rounded text-center">
            <p className="text-xl font-bold">{stats.totalReports}</p>
            <p>Total Reports</p>
          </div>
        </div>
      </section>

      {/* User Management */}
      <section className="mb-10 bg-white shadow rounded p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4">User Management</h2>
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border rounded px-3 py-2 mb-4 w-full max-w-sm"
        />
        <ul className="space-y-2">
          {users
            .filter(user => user.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((user, idx) => (
              <li key={idx} className="border-b py-1">
                {user}
              </li>
            ))}
        </ul>
      </section>

      {/* Reports Management */}
      <section className="mb-10 bg-white shadow rounded p-6">
        <h2 className="text-2xl font-semibold mb-4">Reports Management</h2>
        <ul className="space-y-2">
          {reports.map((report) => (
            <li
              key={report.id}
              className="border p-3 rounded flex justify-between items-center"
            >
              <div>
                <p className="font-medium">{report.title}</p>
                <p className="text-sm text-gray-500">Status: {report.status}</p>
              </div>
              <div className="space-x-2">
                <button className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">
                  Approve
                </button>
                <button className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

    </div>
  );
}
