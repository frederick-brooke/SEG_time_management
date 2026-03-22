'use client';

import Link from "next/link";
import { Users, Crown } from "lucide-react";

//section types
interface GroupCardProps {
  group: {
    id: string;
    name: string;
    description?: string | null;
    memberCount: number;
    userRole: string;
    creator: {
      username: string;
      fname?: string | null;
      lname?: string | null;
    };
  };
}

//section component

/**
 * Displays a group card with name, description, member count and owner badge
 * @param {GroupCardProps} props - Group data to display
 * @return {JSX.Element} - Group card component
 */
export function GroupCard({ group }: GroupCardProps) {
  const isOwner = group.userRole === "OWNER";

  return (
    <div className="flex items-center gap-4 lunar-card bg-white/5 p-5 transition-all hover:bg-white/10 hover:border-white/30 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-white/10">

      {/* Icon */}
      <div className="shrink-0 bg-white/5 p-3 rounded-2xl border border-white/10 shadow-inner">
        <Users className="text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" size={24} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-black tracking-tight text-white truncate drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
              {group.name}
            </h3>
            {group.description && (
              <p className="text-xs text-white/40 truncate mt-0.5">{group.description}</p>
            )}
          </div>
          {isOwner && (
            <span className="text-[9px] px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 font-black uppercase tracking-widest shrink-0 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
              OWNER
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t lunar-divider">
          <div className="flex items-center gap-1.5 text-xs text-white/40 font-medium">
            <Users size={14} className="text-white/30" />
            <span>{group.memberCount} member{group.memberCount !== 1 ? "s" : ""}</span>
          </div>
          <span className="text-[11px] font-semibold text-blue-400">
            by @{group.creator.username}
          </span>
        </div>
      </div>

      {/* View link */}
      <Link
        href={`/groups/${group.id}`}
        className="shrink-0 lunar-button-primary !text-white px-5 py-2.5 text-xs font-bold"
      >
        View
      </Link>
    </div>
  );
}