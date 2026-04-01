'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Users, ListTodo, Calendar, Copy, LogOut, Settings } from "lucide-react";
import { leaveModule } from "@/app/actions/module";

//section types
export interface ModuleHeaderProps {
  module: {
    id: string;
    name: string;
    description: string | null;
    joinPin: string | null;
    maxMembers: number;
    memberCount: number;
    creator: { username: string };
  };
  isOwner: boolean;
  isOwnerOrAdmin: boolean;
  onOpenTaskModal: () => void;
  onOpenEventModal: () => void;
  onOpenSettings: () => void;
}

//section component

/**
 * Header card for the module detail page showing name, member count, and action buttons.
 * @param {ModuleHeaderProps} props - Module data and action callbacks.
 * @return {JSX.Element} Module header card.
 */
export default function ModuleHeader({
  module, isOwner, isOwnerOrAdmin,
  onOpenTaskModal, onOpenEventModal, onOpenSettings,
}: ModuleHeaderProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  /**
   * Copies the join PIN to clipboard and shows a brief confirmation.
   * @return {void}
   */
  const copyPin = () => {
    if (!module.joinPin) return;
    navigator.clipboard.writeText(module.joinPin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /**
   * Confirms and submits a leave module request, then redirects to the modules list.
   * @return {Promise<void>}
   */
  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this module?')) return;
    const result = await leaveModule(module.id);
    if (result.success) {
      router.push('/modules');
    } else {
      alert('error' in result ? result.error : 'Failed to leave module');
    }
  };

  return (
    <div className="lunar-card p-8 mb-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">

        {/* Title and info */}
        <div className="flex items-start gap-4">
          <div className="bg-white/5 p-4 rounded-xl shrink-0 border border-white/10 shadow-inner">
            <BookOpen className="text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" size={32} />
          </div>
          <div>
            <h1 className="lunar-page-title text-3xl">{module.name}</h1>
            {module.description && (
              <p className="lunar-value mt-2">{module.description}</p>
            )}
            <div className="flex items-center gap-4 mt-3 flex-wrap">
              <span className="flex items-center gap-1 lunar-label !text-white">
                <Users size={14} className="text-white/50" /> {module.memberCount}/{module.maxMembers} members
              </span>
              <span className="lunar-label !text-white">by @{module.creator.username}</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 flex-wrap">
          
          {/* Owner Only Actions */}
          {isOwner && (
            <Button onClick={onOpenSettings} className="lunar-button-ghost flex items-center gap-2">
              <Settings size={14} /> Settings
            </Button>
          )}

          {/* Owner or Admin Actions */}
          {isOwnerOrAdmin && (
            <>
              <Button 
                onClick={onOpenTaskModal} 
                className="lunar-button-primary flex items-center gap-2 !bg-white/10 !border-white/20 !text-white hover:!bg-white/20 shadow-[0_0_15px_rgba(255,255,255,0.2)]"
              >
                <ListTodo size={14} /> Create Task
              </Button>
              <Button 
                onClick={onOpenEventModal} 
                className="lunar-button-primary flex items-center gap-2 !bg-white/10 !border-white/20 !text-white hover:!bg-white/20 shadow-[0_0_15px_rgba(255,255,255,0.2)]"
              >
                <Calendar size={14} /> Create Event
              </Button>
            </>
          )}

          {/* Owner Only PIN Copy */}
          {isOwner && module.joinPin && (
            <Button onClick={copyPin} className="lunar-button-ghost flex items-center gap-2">
              <Copy size={14} /> {copied ? 'Copied!' : 'Copy PIN'}
            </Button>
          )}

          {/* Admins & Members (Anyone who is NOT the Owner) can leave */}
          {!isOwner && (
            <Button onClick={handleLeave} className="flex items-center gap-2 lunar-item-error px-4 py-2 rounded-xl border font-bold text-[10px] uppercase tracking-widest hover:bg-red-500/20 transition-colors">
              <LogOut size={14} /> Leave Module
            </Button>
          )}
        </div>
      </div>

      {/* PIN display — owner only */}
      {isOwner && module.joinPin && (
        <div className="mt-6 pt-6 border-t border-white/10">
          <p className="lunar-label mb-2 text-white">Join PIN</p>
          <code className="text-2xl font-mono font-black text-white tracking-wider drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
            {module.joinPin}
          </code>
          <p className="text-[10px] text-white/40 mt-1 font-medium uppercase tracking-widest">Share this PIN with participants</p>
        </div>
      )}
    </div>
  );
}