/**
 * @file ModuleCard.tsx
 * @description A presentation component displaying a summary card for an educational module. 
 * Shows the module name, description, member capacity, ownership status, and provides 
 * a navigation link to the detailed module view.
 */

'use client';

import Link from "next/link";
import { Users, BookOpen } from "lucide-react";

/**
 * Represents the creator of a module.
 */
interface ModuleCreator {
  username: string;
  fname?: string;
  lname?: string;
}

/**
 * Represents the core data of a module.
 */
interface ModuleData {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  maxMembers: number;
  userRole: string;
  joinPin?: string;
  creator: ModuleCreator;
}

/**
 * Props for the ModuleCard component.
 */
interface ModuleCardProps {
  module: ModuleData;
}

/**
 * Renders the decorative module icon.
 *
 * @returns {JSX.Element} The icon container.
 */
function ModuleIcon() {
  return (
    <div className="shrink-0 bg-white/5 p-3 rounded-2xl border border-white/10 shadow-inner">
      <BookOpen className="text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" size={24} />
    </div>
  );
}

/**
 * Renders the module's title, optional description, and role badge.
 *
 * @param {{ name: string; description?: string; isOwner: boolean }} props - Component props.
 * @returns {JSX.Element} The module header block.
 */
function ModuleHeader({ name, description, isOwner }: { name: string; description?: string; isOwner: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-1">
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-black tracking-tight text-white truncate drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
          {name}
        </h3>
        {description && (
          <p className="text-xs text-white/40 truncate mt-0.5">{description}</p>
        )}
      </div>
      {isOwner && (
        <span className="text-[9px] px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 font-black uppercase tracking-widest shrink-0 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
          OWNER
        </span>
      )}
    </div>
  );
}

/**
 * Renders the module's member count and creator handle.
 *
 * @param {{ memberCount: number; maxMembers: number; username: string }} props - Component props.
 * @returns {JSX.Element} The module footer block.
 */
function ModuleFooter({ memberCount, maxMembers, username }: { memberCount: number; maxMembers: number; username: string }) {
  return (
    <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t lunar-divider">
      <div className="flex items-center gap-1.5 text-xs text-white/40 font-medium">
        <Users size={14} className="text-white/30" />
        <span>{memberCount} / {maxMembers}</span>
      </div>
      <span className="text-[11px] font-semibold text-blue-400">
        by @{username}
      </span>
    </div>
  );
}

/**
 * Displays a module card with basic info and member count.
 *
 * @param {ModuleCardProps} props - Module data to display.
 * @returns {JSX.Element} Module card component.
 */
export function ModuleCard({ module }: ModuleCardProps) {
  const isOwner = module.userRole === 'OWNER';

  return (
    <div className="flex items-center gap-4 lunar-card bg-white/5 p-5 transition-all hover:bg-white/10 hover:border-white/30 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-white/10">
      <ModuleIcon />
      
      <div className="flex-1 min-w-0">
        <ModuleHeader name={module.name} description={module.description} isOwner={isOwner} />
        <ModuleFooter memberCount={module.memberCount} maxMembers={module.maxMembers} username={module.creator.username} />
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