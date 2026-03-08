'use client';

import { Users, BookOpen, Crown, Shield, Copy, LogOut } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { leaveModule } from "@/src/app/actions/module";
import { Calendar } from "lucide-react";
import ModuleEventForm from "components/modules/ModuleEventForm";
import { ListTodo } from "lucide-react";
import ModuleTaskForm from "components/modules/ModuleTaskForm";
import { Calendar as CalendarIcon, CheckCircle, Circle } from "lucide-react";




interface ModuleDetailClientProps {
  module: any;
  events: any[];
  tasks: any[];
}
/**
 * Formats date to readable string
 */
function formatEventDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Formats task due date
 */
function formatTaskDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'short',
    year: 'numeric'
  });
}
/**
 * Client component for module detail page
 * @param {ModuleDetailClientProps} props - Module data
 * @return {JSX.Element} - Module detail view
 */
export default function ModuleDetailClient({ module, events, tasks}: ModuleDetailClientProps) {
  const [copied, setCopied] = useState(false);
  const isOwner = module.userRole === 'OWNER';
  const [showEventForm, setShowEventForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);

  /**
   * Copies join PIN to clipboard
   */
  const copyPin = () => {
    if (module.joinPin) {
      navigator.clipboard.writeText(module.joinPin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  /**
   * Handles leaving the module
   */
  const handleLeave = async () => {
    if (confirm('Are you sure you want to leave this module?')) {
      const result = await leaveModule(module.id);
      if (result.success) {
        window.location.href = '/modules';
      } else {
        alert(result.error || 'Failed to leave module');
      }
    }
  };

  return (
    <>
      <div className="flex flex-1 flex-col gap-6 p-6 pt-0">
        <div className="max-w-5xl w-full mx-auto py-8">
          
          {/* Back Link */}
          <Link 
            href="/modules"
            className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block"
          >
            ← Back to Modules
          </Link>

          {/* Module Header */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="bg-blue-50 p-4 rounded-xl">
                  <BookOpen className="text-blue-600" size={32} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{module.name}</h1>
                  {module.description && (
                    <p className="text-gray-600 mt-2">{module.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users size={16} />
                      {module.memberCount}/{module.maxMembers} members
                    </span>
                    <span>Created by @{module.creator.username}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {isOwner && (
                  <>
                    <button onClick={() => setShowTaskForm(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-lg border border-purple-200 font-medium hover:bg-purple-100 transition-colors">
                    <ListTodo size={16} />
                    <span>Create Task</span>
                  </button>
                    <button onClick={() => setShowEventForm(true)} className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg border border-green-200 font-medium hover:bg-green-100 transition-colors">
                      <Calendar size={16} />
                      <span>Create Event</span>
                    </button>
                    {module.joinPin && (
                      <button
                        onClick={copyPin}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-200 font-medium hover:bg-blue-100 transition-colors"
                      >
                        <Copy size={16} />
                        <span>{copied ? 'Copied!' : 'Copy PIN'}</span>
                      </button>
                    )}
                  </>
                )}
                {!isOwner && (
                  <button
                    onClick={handleLeave}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg border border-red-200 font-medium hover:bg-red-100 transition-colors"
                  >
                    <LogOut size={16} />
                    <span>Leave Module</span>
                  </button>
                )}
              </div>
            </div>

            {/* Show PIN to owner */}
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

          {/* Members List */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users size={20} />
              Members ({module.members.length})
            </h2>

            <div className="space-y-2">
              {module.members.map((member: any) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <Link
                    href={`/profile/${member.user.username}`}
                    className="flex items-center gap-3 flex-1"
                  >
                    <div className="w-10 h-10 bg-gray-300 rounded-full overflow-hidden">
                      {member.user.pfp ? (
                        <img 
                          src={member.user.pfp} 
                          alt={member.user.username} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600 font-bold">
                          {member.user.fname?.[0] || member.user.username[0]}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {member.user.fname || member.user.username} {member.user.lname}
                      </p>
                      <p className="text-xs text-gray-500">@{member.user.username}</p>
                    </div>
                  </Link>

                  {/* Role Badge */}
                  {member.role === 'OWNER' && (
                    <span className="flex items-center gap-1 text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded-full border border-purple-200 font-semibold">
                      <Crown size={12} />
                      Owner
                    </span>
                  )}
                  {member.role === 'ADMIN' && (
                    <span className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200 font-semibold">
                      <Shield size={12} />
                      Admin
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Module Events */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mt-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CalendarIcon size={20} className="text-green-600" />
              Upcoming Events ({events.length})
            </h2>

            {events.length > 0 ? (
              <div className="space-y-2">
                {events.map((event: any) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-white border border-green-100 rounded-lg"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{event.title}</h3>
                      {event.description && (
                        <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-gray-500">
                          📅 {formatEventDate(event.start)}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                          {event.category}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No events scheduled yet. {isOwner && "Create one using the button above!"}
              </p>
            )}
          </div>

          {/* Module Tasks */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mt-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ListTodo size={20} className="text-purple-600" />
              Module Tasks ({tasks.length})
            </h2>

            {tasks.length > 0 ? (
              <div className="space-y-2">
                {tasks.map((task: any) => (
                  <div
                    key={task.id}
                    className={`flex items-center justify-between p-4 border rounded-lg transition-all ${
                      task.completed 
                        ? 'bg-gray-50 border-gray-200' 
                        : 'bg-gradient-to-r from-purple-50 to-white border-purple-100'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {task.completed ? (
                        <CheckCircle size={20} className="text-green-600 shrink-0" />
                      ) : (
                        <Circle size={20} className="text-purple-600 shrink-0" />
                      )}
                      <div className="flex-1">
                        <h3 className={`font-semibold ${task.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          {task.dueDate && (
                            <span className="text-xs text-gray-500">
                              📅 Due: {formatTaskDate(task.dueDate)}
                            </span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            task.priority === 'High' ? 'bg-red-100 text-red-700' :
                            task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {task.priority}
                          </span>
                          {task.duration > 0 && (
                            <span className="text-xs text-gray-500">
                              ⏱️ {task.duration < 60 ? `${task.duration}m` : `${Math.floor(task.duration / 60)}h ${task.duration % 60}m`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No tasks assigned yet. {isOwner && "Create one using the button above!"}
              </p>
            )}
          </div>

        </div>
      </div>
      {showEventForm && (
        <ModuleEventForm
          moduleId={module.id}
          onClose={() => setShowEventForm(false)}
          onSuccess={() => {
            window.location.reload();
          }}
        />
      )}
      {showTaskForm && (
      <ModuleTaskForm
        moduleId={module.id}
        isOpen={showTaskForm}
        onOpenChange={setShowTaskForm}
        onSuccess={() => {
          alert("Task created for all module members!");
        }}
      />
    )}
    </>
  );
}