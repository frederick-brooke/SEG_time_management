"use client";

import { useState } from "react";
import SearchControls from "@/components/search-page/search-controls";
import SearchUsers from "@/components/search-page/searchUsers";
import SearchTasks from "@/components/search-page/searchTasks";
import UserFilter from "@/components/admin/user-filter-panel";
import TaskFilter from "@/components/search-page/task-filter-panel";

import { useUsers } from "@/hooks/useUsers";
import { useTaskSearch } from "@/hooks/useTaskSearch";

export default function SearchPanel({ open, onClose }) {

  const defaultUserFilters = { search:"", sortBy:"username", order:"desc", startDate:"", endDate:"", categories:[], page:1, limit:12 };
  const defaultTaskFilters = { search:"", sortBy:"createdAt", order:"desc", startDate:"", endDate:"", status:[], priority:[], completed:"", page:1, limit:12 };

  const [currentTab,setCurrentTab] = useState("users");

  const [appliedUserFilters,setAppliedUserFilters] = useState(defaultUserFilters);
  const [draftUserFilters,setDraftUserFilters] = useState(defaultUserFilters);

  const [appliedTaskFilters,setAppliedTaskFilters] = useState(defaultTaskFilters);
  const [draftTaskFilters,setDraftTaskFilters] = useState(defaultTaskFilters);

  const [isUserFilterOpen,setIsUserFilterOpen] = useState(false);
  const [isTaskFilterOpen,setIsTaskFilterOpen] = useState(false);

  const {users,totalUserPages,totalUsers} = useUsers(appliedUserFilters,"/api/users/search");
  const {tasks,totalTaskPages,totalTasks} = useTaskSearch(appliedTaskFilters,"/api/tasks/search");

  if (!open) return null;

  return (
    <>
      {/* backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/20 z-40"
      />

      {/* drawer */}
      <div className="fixed left-16 top-0 h-full w-[420px] bg-white z-50 shadow-xl border-r flex flex-col">

        {/* header */}
        <div className="p-5 border-b">
          <h2 className="text-xl font-semibold">Search</h2>
        </div>

        {/* search controls */}
        <div className="p-4 border-b">
          {currentTab === "users" && (
            <SearchControls
              filters={appliedUserFilters}
              setFilters={setAppliedUserFilters}
              placeholder="Search users..."
              onOpenFilter={() => setIsUserFilterOpen(true)}
            />
          )}

          {currentTab === "tasks" && (
            <SearchControls
              filters={appliedTaskFilters}
              setFilters={setAppliedTaskFilters}
              placeholder="Search tasks..."
              onOpenFilter={() => setIsTaskFilterOpen(true)}
            />
          )}
        </div>

        {/* tabs */}
        <div className="flex border-b">
          {["users","tasks","modules"].map(tab => (
            <button
              key={tab}
              onClick={() => setCurrentTab(tab)}
              className={`flex-1 py-3 text-sm font-medium capitalize
              ${currentTab === tab
                ? "border-b-2 border-black text-black"
                : "text-gray-500"}
              `}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* content */}
        <div className="flex-1 overflow-y-auto p-4">

          {currentTab === "users" && (
            <SearchUsers
              users={users}
              totalUsers={totalUsers}
              totalUserPages={totalUserPages}
              setIsUserFilterOpen={setIsUserFilterOpen}
              filters={appliedUserFilters}
              setFilters={setAppliedUserFilters}
            />
          )}

          {currentTab === "tasks" && (
            <SearchTasks
              tasks={tasks}
              totalTasks={totalTasks}
              totalTaskPages={totalTaskPages}
              setIsTaskFilterOpen={setIsTaskFilterOpen}
              filters={appliedTaskFilters}
              setFilters={setAppliedTaskFilters}
            />
          )}

        </div>

      </div>

      {/* filters */}
      {isUserFilterOpen && (
        <UserFilter
          filters={draftUserFilters}
          setFilters={setDraftUserFilters}
          onClose={() => setIsUserFilterOpen(false)}
          applyFilters={()=>{
            setAppliedUserFilters(draftUserFilters)
            setIsUserFilterOpen(false)
          }}
        />
      )}

      {isTaskFilterOpen && (
        <TaskFilter
          filters={draftTaskFilters}
          setFilters={setDraftTaskFilters}
          onClose={() => setIsTaskFilterOpen(false)}
          applyFilters={()=>{
            setAppliedTaskFilters(draftTaskFilters)
            setIsTaskFilterOpen(false)
          }}
        />
      )}

    </>
  );
}