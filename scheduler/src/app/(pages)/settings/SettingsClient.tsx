'use client';

import { useState, useTransition } from "react";
import { updateAccountDetails, changePassword, disconnectGoogle, updatePreferences, deleteAccount } from "@/app/actions/settings";
import { signIn, signOut } from "next-auth/react";
import { Key, User, Globe, AlertCircle, CheckCircle2, Sliders, AlertTriangle, HelpCircle } from "lucide-react";

interface SettingsClientProps {
  user: {
    username: string;
    email: string;
    hasPassword?: boolean;
    hasGoogleConnected: boolean;
    preferences: any;
  }
}

// Shared input class
const inputCls = "w-full bg-white/5 border border-white/10 text-white placeholder-white/25 p-3 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-colors";
const labelCls = "text-sm font-medium text-white/50";

export function SettingsClient({ user }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<'account' | 'preferences' | 'security' | 'integrations'>('account');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStage, setDeleteStage] = useState<'initial' | 'password'>('initial');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const currentDaysOff = user.preferences?.daysOff || [];

  const handleAction = (actionFn: (formData: FormData) => Promise<any>, successMsg: string) =>
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null); setSuccess(null);
      const formData = new FormData(e.currentTarget);
      const form = e.currentTarget;
      startTransition(async () => {
        try {
          await actionFn(formData);
          setSuccess(successMsg);
          if (actionFn === changePassword) form.reset();
        } catch (err: any) { setError(err.message); }
      });
    };

  const handleDisconnectGoogle = () => {
    setError(null); setSuccess(null);
    startTransition(async () => {
      try { await disconnectGoogle(); setSuccess("Google account disconnected."); }
      catch (err: any) { setError(err.message); }
    });
  };

  const handleDeleteAccount = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setDeleteError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try { await deleteAccount(formData); await signOut({ callbackUrl: "/login" }); }
      catch (err: any) { setDeleteError(err.message); }
    });
  };

  const closeDeleteModal = () => { setShowDeleteModal(false); setDeleteStage('initial'); setDeleteError(null); };

  const tabs = [
    { key: 'account', label: 'Account', icon: User },
    { key: 'preferences', label: 'Preferences', icon: Sliders },
    { key: 'security', label: 'Security', icon: Key },
    { key: 'integrations', label: 'Integrations', icon: Globe },
  ] as const;

  const btnCls = `bg-blue-500/20 text-blue-300 border border-blue-500/30 px-5 py-2.5 rounded-xl font-medium hover:bg-blue-500/30 transition-colors disabled:opacity-40 text-sm`;

  return (
    <div className="flex flex-col md:flex-row gap-6 relative">

      {/* Sidebar */}
      <div className="w-full md:w-52 shrink-0 flex flex-row md:flex-col gap-1.5">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => { setActiveTab(key); setError(null); setSuccess(null); }}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors ${
              activeTab === key
                ? 'bg-white/10 text-white border border-white/15'
                : 'text-white/45 hover:text-white/70 hover:bg-white/5'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Content panel */}
      <div className="flex-1 bg-white/[0.04] border border-white/10 rounded-2xl p-8 backdrop-blur-sm min-h-[400px]">

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 text-red-300 rounded-xl flex items-center gap-3 border border-red-500/20 text-sm">
            <AlertCircle size={16} /> {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-emerald-500/10 text-emerald-300 rounded-xl flex items-center gap-3 border border-emerald-500/20 text-sm">
            <CheckCircle2 size={16} /> {success}
          </div>
        )}

        {/* ── Account ── */}
        {activeTab === 'account' && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-lg font-semibold text-white mb-1">Account Details</h2>
            <p className="text-sm text-white/40 mb-8">Update your username and email address.</p>
            <form onSubmit={handleAction(updateAccountDetails, "Account details updated.")} className="space-y-5 max-w-md">
              <div className="space-y-2">
                <label className={labelCls}>Username</label>
                <input name="username" defaultValue={user.username} required pattern="^[a-zA-Z0-9_-]{3,20}$" className={inputCls} />
              </div>
              <div className="space-y-2">
                <label className={labelCls}>Email Address</label>
                <input type="email" name="email" defaultValue={user.email} required className={inputCls} />
              </div>
              <button disabled={isPending} type="submit" className={btnCls}>
                {isPending ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        )}

        {/* ── Preferences ── */}
        {activeTab === 'preferences' && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-lg font-semibold text-white mb-1">Workflow Preferences</h2>
            <p className="text-sm text-white/40 mb-8">Tune your scheduling to match how you work.</p>
            <form onSubmit={handleAction(updatePreferences, "Preferences saved.")} className="space-y-8">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className={labelCls}>Work Start Time</label>
                  <input type="time" name="workStartTime" defaultValue={user.preferences?.workStartTime || "09:00"} className={inputCls} />
                </div>
                <div className="space-y-2">
                  <label className={labelCls}>Work End Time</label>
                  <input type="time" name="workEndTime" defaultValue={user.preferences?.workEndTime || "17:00"} className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-5">
                {[
                  { label: "Focus Session (mins)", name: "sessionLength", default: 60 },
                  { label: "Break Length (mins)", name: "breakLength", default: 15 },
                  { label: "Breaks Per Day", name: "breaksPerDay", default: 3 },
                ].map(f => (
                  <div key={f.name} className="space-y-2">
                    <label className={labelCls}>{f.label}</label>
                    <input type="number" name={f.name} defaultValue={user.preferences?.[f.name] || f.default} className={inputCls} />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-5">
                {[
                  { label: "Max Tasks / Day", name: "maxTasksPerDay", default: 10 },
                  { label: "Default Task (mins)", name: "defaultTaskDuration", default: 30 },
                  { label: "Reminder (Days before)", name: "reminderDays", default: 1 },
                ].map(f => (
                  <div key={f.name} className="space-y-2">
                    <label className={labelCls}>{f.label}</label>
                    <input type="number" name={f.name} defaultValue={user.preferences?.[f.name] || f.default} className={inputCls} />
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <label className={labelCls}>Preferred Task Order</label>
                <select name="taskOrder" defaultValue={user.preferences?.taskOrder || "priority"} className={inputCls}>
                  <option value="priority">By Priority</option>
                  <option value="due_date">By Due Date</option>
                  <option value="duration">By Shortest Duration</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className={labelCls}>Days Off</label>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map(day => (
                    <label key={day} className="flex items-center gap-2 cursor-pointer bg-white/5 border border-white/10 px-4 py-2 rounded-xl hover:bg-white/10 transition-colors">
                      <input type="checkbox" name="daysOff" value={day} defaultChecked={currentDaysOff.includes(day)} className="w-4 h-4 accent-blue-400 rounded" />
                      <span className="text-sm text-white/60">{day}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button disabled={isPending} type="submit" className={btnCls}>
                {isPending ? "Saving..." : "Save Preferences"}
              </button>
            </form>
          </div>
        )}

        {/* ── Security ── */}
        {activeTab === 'security' && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-lg font-semibold text-white mb-1">Security</h2>
            <p className="text-sm text-white/40 mb-8">Update your password to keep your account secure.</p>

            <form onSubmit={handleAction(changePassword, "Password updated.")} className="space-y-5 max-w-md mb-12">
              {[
                { label: "Current Password", name: "currentPassword" },
                { label: "New Password", name: "newPassword" },
                { label: "Confirm New Password", name: "confirmPassword" },
              ].map(f => (
                <div key={f.name} className="space-y-2">
                  <label className={labelCls}>{f.label}</label>
                  <input type="password" name={f.name} required minLength={f.name !== 'currentPassword' ? 6 : undefined} className={inputCls} />
                </div>
              ))}
              <button disabled={isPending} type="submit" className={btnCls}>
                {isPending ? "Saving..." : "Update Password"}
              </button>
            </form>

            <div className="pt-8 border-t border-white/10">
              <h3 className="text-base font-semibold text-white mb-1">Delete Account</h3>
              <p className="text-sm text-white/40 mb-4">Permanently remove your account and all associated data.</p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 border border-red-500/20 bg-red-500/5 text-red-400 rounded-xl text-sm font-medium hover:bg-red-500/10 transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        )}

        {/* ── Integrations ── */}
        {activeTab === 'integrations' && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-lg font-semibold text-white mb-1">Integrations</h2>
            <p className="text-sm text-white/40 mb-8">Connect third-party services to your account.</p>

            <div className="border border-white/10 bg-white/[0.03] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 bg-white/5 border border-white/10 rounded-full flex items-center justify-center p-2.5 shrink-0">
                  <svg viewBox="0 0 24 24" className="w-full h-full">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Google Workspace</h3>
                  <p className="text-xs text-white/40 mt-0.5">Sync your calendar and tasks.</p>
                </div>
              </div>

              {user.hasGoogleConnected ? (
                <button
                  onClick={handleDisconnectGoogle}
                  disabled={isPending}
                  className="px-4 py-2 border border-red-500/20 text-red-400 bg-red-500/5 hover:bg-red-500/10 rounded-xl text-sm font-medium transition-colors disabled:opacity-40"
                >
                  {isPending ? "Disconnecting..." : "Disconnect"}
                </button>
              ) : (
                <button
                  onClick={() => signIn('google')}
                  className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-xl text-sm font-medium transition-colors"
                >
                  Connect Google
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Delete Modal ── */}
      {showDeleteModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-gray-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-7 animate-in zoom-in-95 duration-200">

            {deleteStage === 'initial' && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <HelpCircle size={24} className="text-white/40" />
                  <h2 className="text-lg font-semibold text-white">Delete Account?</h2>
                </div>
                <p className="text-sm text-white/50 mb-8 leading-relaxed">
                  Are you sure you want to delete your account? This will permanently erase all your data and cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                  <button onClick={closeDeleteModal} className="px-5 py-2.5 text-white/50 hover:text-white/80 text-sm font-medium transition-colors">
                    Cancel
                  </button>
                  <button onClick={() => setDeleteStage('password')} className="px-5 py-2.5 bg-white/10 text-white hover:bg-white/15 rounded-xl text-sm font-medium transition-colors">
                    Continue
                  </button>
                </div>
              </div>
            )}

            {deleteStage === 'password' && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle size={24} className="text-red-400" />
                  <h2 className="text-lg font-semibold text-white">Confirm Deletion</h2>
                </div>
                <p className="text-sm text-white/50 mb-6 leading-relaxed">Enter your password to permanently delete your account. This cannot be undone.</p>

                {deleteError && (
                  <div className="mb-4 p-3 bg-red-500/10 text-red-300 text-sm rounded-xl border border-red-500/20 flex items-center gap-2">
                    <AlertCircle size={14} /> {deleteError}
                  </div>
                )}

                <form onSubmit={handleDeleteAccount}>
                  <input
                    type="password"
                    name="password"
                    required
                    autoFocus
                    placeholder="Your password"
                    className={`${inputCls} mb-6`}
                  />
                  <div className="flex justify-end gap-3">
                    <button type="button" onClick={closeDeleteModal} disabled={isPending} className="px-4 py-2 text-white/50 hover:text-white/80 text-sm font-medium transition-colors">
                      Cancel
                    </button>
                    <button type="submit" disabled={isPending} className="px-5 py-2.5 bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 rounded-xl text-sm font-medium transition-colors disabled:opacity-40">
                      {isPending ? "Deleting..." : "Permanently Delete"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}