'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Users, ListTodo, Calendar, Copy, LogOut } from "lucide-react";
import { leaveModule } from "@/app/actions/module";

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
}

export default function ModuleHeader({
  module,
  isOwner,
  isOwnerOrAdmin,
  onOpenTaskModal,
  onOpenEventModal,
}: ModuleHeaderProps) {
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
      alert(result.error || 'Failed to leave module');
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-6 shadow-sm">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        
        {/* Title & Info */}
        <div className="flex items-start gap-4">
          <div className="bg-blue-50 p-4 rounded-xl shrink-0">
            <BookOpen className="text-blue-600" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{module.name}</h1>
            {module.description && (
              <p className="text-gray-600 mt-2">{module.description}</p>
            )}
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 flex-wrap">
              <span className="flex items-center gap-1">
                <Users size={16} /> {module.memberCount}/{module.maxMembers} members
              </span>
              <span>Created by @{module.creator.username}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          {isOwner && (
            <>
              <button
                onClick={onOpenTaskModal}
                className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-lg border border-purple-200 font-medium hover:bg-purple-100 transition-colors"
              >
                <ListTodo size={16} /> Create Task
              </button>
              <button
                onClick={onOpenEventModal}
                className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg border border-green-200 font-medium hover:bg-green-100 transition-colors"
              >
                <Calendar size={16} /> Create Event
              </button>
              {module.joinPin && (
                <button
                  onClick={copyPin}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-200 font-medium hover:bg-blue-100 transition-colors"
                >
                  <Copy size={16} /> {copied ? 'Copied!' : 'Copy PIN'}
                </button>
              )}
            </>
          )}
          
          {!isOwnerOrAdmin && (
            <button
              onClick={handleLeave}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg border border-red-200 font-medium hover:bg-red-100 transition-colors"
            >
              <LogOut size={16} /> Leave Module
            </button>
          )}
        </div>
      </div>

      {/* PIN Display (Owner Only) */}
      {isOwner && module.joinPin && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Join PIN</p>
          <code className="text-2xl font-mono font-bold text-blue-600 tracking-wider">
            {module.joinPin}
          </code>
          <p className="text-xs text-gray-500 mt-1">Share this PIN with participants</p>
        </div>
      )}
    </div>
  );
}