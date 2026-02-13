// pages/admin.js
"use client";

import { useState, useEffect, useTransition } from "react";
import UserPanel from "@/components/admin-user-panel";

export default function AdminPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null); //user profile view

  // Mock data
  const reports = [
    { id: 1, title: "Spam message", status: "Pending" },
    { id: 2, title: "Offensive content", status: "Reviewed" },
  ];

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchUsers();
    }, 400);

  return () => clearTimeout(delay);
  }, [searchQuery]);

  async function fetchUsers(){
    try {
      const res = await fetch(
        `/api/admin?search=${searchQuery}&sortBy=username&order=asc&page=1&limit=10`
      );

      if(!res.ok){
        return;
      }

      const data = await res.json();
      setStats(data.users);
      setLoading(false);
    } catch (err){
      setLoading(false);
    }
  }

  if(loading){
    return <p className="p-6">Loading</p>;
  }

  const users = stats?.users ?? [];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* Statistics */}
      <section className="bg-white shadow rounded p-6 mb-4">
        <h2 className="text-2xl font-semibold mb-4">Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-100 p-4 rounded text-center">
            <p className="text-xl font-bold">
              {stats?.totalUsers ?? "-"}
            </p>
            <p>Total Users</p>
          </div>
          <div className="bg-yellow-100 p-4 rounded text-center">
            <p className="text-xl font-bold">0</p>
            <p>Active Reports</p>
          </div>
          <div className="bg-red-100 p-4 rounded text-center">
            <p className="text-xl font-bold">0</p>
            <p>Total Reports</p>
          </div>
        </div>
      </section>

      {/* Container for the user reporting system*/}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Management */}
        <section className="mb-4 bg-white shadow rounded p-6">
          <h2 className="text-2xl font-semibold mb-4">User Management</h2>
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border rounded px-3 py-2 mb-4 w-full max-w-sm"
          />
          <ul className="space-y-2">
            {users.map((user) => (
                <li key={user.id} 
                onClick={() => setSelectedUser(user)}
                className="border-b py-1 cursor-pointer">
                  {user.username}
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

      

      <UserPanel user={selectedUser} onClose={() => setSelectedUser(null)}/>
    </div>
  );
}
