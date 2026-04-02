/**
 * @file TaskStatsCard.tsx
 * @description Renders a dashboard card displaying the user's task performance metrics,
 * including completed tasks, total tasks, and a visual success rate progress bar.
 */
'use client';

import { Trophy } from "lucide-react";

/**
 * Props for the StatBox component.
 */
interface StatBoxProps {
  label: string;
  value: number | string;
  suffix?: string;
}

/**
 * Represents the statistical data for a user's task performance.
 */
interface TaskStatsData {
  completedTasks?: number;
  totalTasks?: number;
  completionRate?: number;
}

/**
 * Props for the TaskStatsCard component.
 */
interface TaskStatsCardProps {
  stats: TaskStatsData;
}

/**
 * Reusable unit for displaying a specific stat block to maintain DRY code.
 *
 * @param {StatBoxProps} props - Component props.
 * @returns {JSX.Element} The rendered stat box.
 */
function StatBox({ label, value, suffix }: StatBoxProps) {
  return (
    <div className="bg-white/10 p-4 rounded-xl flex flex-col border border-white/20">
      <span className="lunar-label mb-1 text-white/60">{label}</span>
      <div className="flex items-baseline gap-2 mt-1">
        <span className="text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
          {value}
        </span>
        {suffix && <span className="text-sm text-white/40 font-medium">{suffix}</span>}
      </div>
    </div>
  );
}

/**
 * Renders the user's task performance statistics and progress bar.
 *
 * @param {TaskStatsCardProps} props - Component props.
 * @returns {JSX.Element} The task performance card UI.
 */
export default function TaskStatsCard({ stats }: TaskStatsCardProps) {
  const completedTasks = stats?.completedTasks ?? 0;
  const totalTasks = stats?.totalTasks ?? 0;
  const completionRate = stats?.completionRate ?? 0;
  const isPassing = completionRate >= 50;

  return (
    <div className="md:col-span-2 lunar-card p-6 flex flex-col">
      <h3 className="lunar-label mb-4 flex items-center gap-2 text-white">
        <Trophy className="text-white" size={16} /> Task Performance
      </h3>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatBox label="Completed" value={completedTasks} suffix={`/ ${totalTasks} total`} />
        <StatBox label="Success Rate" value={completionRate} suffix="%" />
      </div>

      <div className="mt-auto">
        <div className="flex justify-between lunar-label mb-2">
          <span className="text-white/60">Progress</span>
          <span className={isPassing ? "text-emerald-400" : "text-white/40"}>
            {completionRate}%
          </span>
        </div>
        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
          <div
            className="h-full bg-white transition-all duration-1000 ease-out rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>
    </div>
  );
}