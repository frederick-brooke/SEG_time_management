'use client';
import { Button } from "@/components/ui/Button";

import Link from "next/link";
import { Users, BookOpen } from "lucide-react";

//section types
interface ModuleCardProps {
  module: {
    id: string;
    name: string;
    description?: string;
    memberCount: number;
    maxMembers: number;
    userRole: string;
    joinPin?: string;
    creator: { username: string; fname?: string; lname?: string };
  };
}

//section component

/**
 * Displays a module card with basic info and member count.
 * @param {ModuleCardProps} props - Module data to display.
 * @return {JSX.Element} Module card component.
 */
export function ModuleCard({ module }: ModuleCardProps) {
  const isOwner = module.userRole === 'OWNER';

  return (
    <div className="flex items-center gap-4 lunar-card bg-white/5 p-5 transition-all hover:bg-white/10 hover:border-white/30 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-white/10">

      <div className="shrink-0 bg-white/5 p-3 rounded-2xl border border-white/10 shadow-inner">
        <BookOpen className="text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" size={24} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-black tracking-tight text-white truncate drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
              {module.name}
            </h3>
            {module.description && (
              <p className="text-xs text-white/40 truncate mt-0.5">{module.description}</p>
            )}
          </div>
          {isOwner && (
            <span className="text-[9px] px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 font-black uppercase tracking-widest shrink-0 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
              OWNER
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t lunar-divider">
          <div className="flex items-center gap-1.5 text-xs text-white/40 font-medium">
            <Users size={14} className="text-white/30" />
            <span>{module.memberCount} / {module.maxMembers}</span>
          </div>
          <span className="text-[11px] font-semibold text-blue-400">by @{module.creator.username}</span>
        </div>
      </div>

      <Link
        href={`/modules/${module.id}`}
        className="shrink-0 lunar-button-primary !text-white px-5 py-2.5 text-xs font-bold"
      >
        View
      </Link>
    </div>
  );
}