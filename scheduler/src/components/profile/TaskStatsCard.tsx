'use client';

import { Trophy } from "lucide-react";

/**
 * Renders the user's task performance statistics and progress bar.
 * @param {Object} props - Component props.
 * @param {any} props.stats - The statistics object containing task data.
 * @return {JSX.Element} The task performance card UI.
 */
export default function TaskStatsCard({ stats }: { stats: any }) {
  const completedTasks = stats?.completedTasks ?? 0;
  const totalTasks = stats?.totalTasks ?? 0;
  const completionRate = stats?.completionRate ?? 0;
  const isPassing = completionRate >= 50;

  return (
    <div className="md:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col">
      <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Trophy className="text-yellow-500" size={18} /> Task Performance
      </h3>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-xl flex flex-col border border-blue-100">
          <span className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Completed</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-4xl font-bold text-blue-700">{completedTasks}</span>
            <span className="text-sm text-blue-500 font-medium">/ {totalTasks} total</span>
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-xl flex flex-col border border-green-100">
          <span className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Success Rate</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-4xl font-bold text-green-700">{completionRate}</span>
            <span className="text-xl font-bold text-green-500">%</span>
          </div>
        </div>
      </div>
      
      <div className="mt-auto">
        <div className="flex justify-between text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">
          <span>Progress</span>
          <span className={isPassing ? "text-green-600" : "text-gray-500"}>
            {completionRate}%
          </span>
        </div>
        <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-1000 ease-out rounded-full"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>
    </div>
  );
}