/**
 * @file ModuleHeader.tsx
 * @description Renders the main header for a module's detail view. 
 * Displays core metadata (title, member count) and provides role-based 
 * action controls for settings, task/event creation, and leaving the module.
 */

'use client';

import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Users, ListTodo, Calendar, Copy, LogOut, Settings } from "lucide-react";
import { leaveModule } from "@/app/actions/module";

/**
 * Represents the creator of a module.
 */
interface ModuleCreator {
  username: string;
}

/**
 * Represents the core metadata of a module.
 */
interface ModuleData {
  id: string;
  name: string;
  description: string | null;
  joinPin: string | null;
  maxMembers: number;
  memberCount: number;
  creator: ModuleCreator;
}

/**
 * Props for the main ModuleHeader component.
 */
export interface ModuleHeaderProps {
  module: ModuleData;
  isOwner: boolean;
  isOwnerOrAdmin: boolean;
  onOpenTaskModal: () => void;
  onOpenEventModal: () => void;
  onOpenSettings: () => void;
}

/**
 * Props for the action buttons sub-component.
 */
interface ActionButtonsProps {
  isOwner: boolean;
  isOwnerOrAdmin: boolean;
  hasJoinPin: boolean;
  copied: boolean;
  onOpenSettings: () => void;
  onOpenTaskModal: () => void;
  onOpenEventModal: () => void;
  copyPin: () => void;
  onLeave: () => void;
}

/**
 * Renders the module's title, description, and metadata block.
 *
 * @param {{ module: ModuleData }} props - Component props.
 * @returns {JSX.Element} The module information display.
 */
function ModuleInfoDisplay({ module }: { module: ModuleData }) {
  return (
    <div className="flex items-start gap-4">
      <div className="bg-white/5 p-4 rounded-xl shrink-0 border border-white/10 shadow-inner">
        <BookOpen className="text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" size={32} />
      </div>
      <div>
        <h1 className="lunar-page-title text-3xl">{module.name}</h1>
        {module.description && <p className="lunar-value mt-2">{module.description}</p>}
        <div className="flex items-center gap-4 mt-3 flex-wrap">
          <span className="flex items-center gap-1 lunar-label !text-white">
            <Users size={14} className="text-white/50" /> {module.memberCount}/{module.maxMembers} members
          </span>
          <span className="lunar-label !text-white">by @{module.creator.username}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Renders role-based action buttons for module management.
 *
 * @param {ActionButtonsProps} props - Component props.
 * @returns {JSX.Element} The cluster of action buttons.
 */
function ActionButtons({ isOwner, isOwnerOrAdmin, hasJoinPin, copied, onOpenSettings, onOpenTaskModal, onOpenEventModal, copyPin, onLeave }: ActionButtonsProps) {
  const primaryBtn = "lunar-button-primary flex items-center gap-2 !bg-white/10 !border-white/20 !text-white hover:!bg-white/20 shadow-[0_0_15px_rgba(255,255,255,0.2)]";
  
  return (
    <div className="flex gap-2 flex-wrap">
      {isOwner && (
        <Button onClick={onOpenSettings} className="lunar-button-ghost flex items-center gap-2">
          <Settings size={14} /> Settings
        </Button>
      )}

      {isOwnerOrAdmin && (
        <>
          <Button onClick={onOpenTaskModal} className={primaryBtn}>
            <ListTodo size={14} /> Create Task
          </Button>
          <Button onClick={onOpenEventModal} className={primaryBtn}>
            <Calendar size={14} /> Create Event
          </Button>
        </>
      )}

      {isOwner && hasJoinPin && (
        <Button onClick={copyPin} className="lunar-button-ghost flex items-center gap-2">
          <Copy size={14} /> {copied ? 'Copied!' : 'Copy PIN'}
        </Button>
      )}

      {!isOwner && (
        <Button onClick={onLeave} className="flex items-center gap-2 lunar-item-error px-4 py-2 rounded-xl border font-bold text-[10px] uppercase tracking-widest hover:bg-red-500/20 transition-colors">
          <LogOut size={14} /> Leave Module
        </Button>
      )}
    </div>
  );
}

/**
 * Renders the Join PIN section strictly for the module owner.
 *
 * @param {{ pin: string }} props - Component props.
 * @returns {JSX.Element} The Join PIN display.
 */
function JoinPinDisplay({ pin }: { pin: string }) {
  return (
    <div className="mt-6 pt-6 border-t border-white/10">
      <p className="lunar-label mb-2 text-white">Join PIN</p>
      <code className="text-2xl font-mono font-black text-white tracking-wider drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
        {pin}
      </code>
      <p className="text-[10px] text-white/40 mt-1 font-medium uppercase tracking-widest">Share this PIN with participants</p>
    </div>
  );
}

/**
 * Header card for the module detail page showing name, member count, and action buttons.
 *
 * @param {ModuleHeaderProps} props - Module data and action callbacks.
 * @returns {JSX.Element} Module header card.
 */
export default function ModuleHeader({ module, isOwner, isOwnerOrAdmin, onOpenTaskModal, onOpenEventModal, onOpenSettings }: ModuleHeaderProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const copyPin = () => {
    if (!module.joinPin) return;
    navigator.clipboard.writeText(module.joinPin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
        <ModuleInfoDisplay module={module} />
        
        <ActionButtons 
          isOwner={isOwner}
          isOwnerOrAdmin={isOwnerOrAdmin}
          hasJoinPin={!!module.joinPin}
          copied={copied}
          onOpenSettings={onOpenSettings}
          onOpenTaskModal={onOpenTaskModal}
          onOpenEventModal={onOpenEventModal}
          copyPin={copyPin}
          onLeave={handleLeave}
        />
      </div>

      {isOwner && module.joinPin && <JoinPinDisplay pin={module.joinPin} />}
    </div>
  );
}