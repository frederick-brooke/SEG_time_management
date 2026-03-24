'use client';

import { useState, useTransition } from "react";
import { updateAccountDetails, changePassword, disconnectGoogle, updatePreferences, deleteAccount } from "@/app/actions/settings";
import { signIn, signOut } from "next-auth/react";
import { Key, User, Globe, AlertCircle, CheckCircle2, Sliders, AlertTriangle, HelpCircle } from "lucide-react";
import { TabKey } from "@/src/types/settings";


interface SettingsClientProps {
  user: { username: string; email: string; hasPassword?: boolean; hasGoogleConnected: boolean; preferences: any; }
}


function FormInput({ label, type = "text", name, defaultValue, required, pattern, minLength, options }: any) {
  const inputCls = "w-full bg-white/5 border border-white/10 text-white placeholder-white/25 p-3 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-colors appearance-none";
  
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-white/50">{label}</label>
      {options ? (
        <select name={name} defaultValue={defaultValue} className={inputCls}>
          {options.map((opt: any) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      ) : (
        <input type={type} name={name} defaultValue={defaultValue} required={required} pattern={pattern} minLength={minLength} className={inputCls} />
      )}
    </div>
  );
}

function SubmitBtn({ isPending, text }: { isPending: boolean, text: string }) {
  return (
    <button disabled={isPending} type="submit" className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-5 py-2.5 rounded-xl font-medium hover:bg-blue-500/30 transition-colors disabled:opacity-40 text-sm">
      {isPending ? "Saving..." : text}
    </button>
  );
}

function StatusMessage({ error, success }: { error: string | null, success: string | null }) {
  if (error) return <div className="mb-6 p-4 bg-red-500/10 text-red-300 rounded-xl flex items-center gap-3 border border-red-500/20 text-sm"><AlertCircle size={16} /> {error}</div>;
  if (success) return <div className="mb-6 p-4 bg-emerald-500/10 text-emerald-300 rounded-xl flex items-center gap-3 border border-emerald-500/20 text-sm"><CheckCircle2 size={16} /> {success}</div>;
  return null;
}


export function SettingsClient({ user }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('account');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStage, setDeleteStage] = useState<'initial' | 'password'>('initial');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const currentDaysOff = user.preferences?.daysOff || [];

  // Form Handlers
  const handleAction = (actionFn: (formData: FormData) => Promise<any>, successMsg: string) => async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setError(null); setSuccess(null);
    const formData = new FormData(e.currentTarget);
    const form = e.currentTarget;
    startTransition(async () => {
      try { await actionFn(formData); setSuccess(successMsg); if (actionFn === changePassword) form.reset(); } 
      catch (err: any) { setError(err.message); }
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
    e.preventDefault(); setDeleteError(null);
    startTransition(async () => {
      try { await deleteAccount(new FormData(e.currentTarget)); await signOut({ callbackUrl: "/login" }); }
      catch (err: any) { setDeleteError(err.message); }
    });
  };

  const tabs = [
    { key: 'account', label: 'Account', icon: User },
    { key: 'preferences', label: 'Preferences', icon: Sliders },
    { key: 'security', label: 'Security', icon: Key },
    { key: 'integrations', label: 'Integrations', icon: Globe },
  ] as const;

  return (
    <div className="flex flex-col md:flex-row gap-6 relative">

      {/* Sidebar Navigation */}
      <div className="w-full md:w-52 shrink-0 flex flex-row md:flex-col gap-1.5">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => { setActiveTab(key); setError(null); setSuccess(null); }} className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors ${activeTab === key ? 'bg-white/10 text-white border border-white/15' : 'text-white/45 hover:text-white/70 hover:bg-white/5'}`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* Content Panel */}
      <div className="flex-1 bg-white/[0.04] border border-white/10 rounded-2xl p-8 backdrop-blur-sm min-h-[400px]">
        <StatusMessage error={error} success={success} />

        {/* ── ACCOUNT TAB ── */}
        {activeTab === 'account' && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-lg font-semibold text-white mb-1">Account Details</h2>
            <p className="text-sm text-white/40 mb-8">Update your username and email address.</p>
            <form onSubmit={handleAction(updateAccountDetails, "Account details updated.")} className="space-y-5 max-w-md">
              <FormInput label="Username" name="username" defaultValue={user.username} required pattern="^[a-zA-Z0-9_-]{3,20}$" />
              <FormInput label="Email Address" type="email" name="email" defaultValue={user.email} required />
              <SubmitBtn isPending={isPending} text="Save Changes" />
            </form>
          </div>
        )}

        {/* ── PREFERENCES TAB ── */}
        {activeTab === 'preferences' && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-lg font-semibold text-white mb-1">Workflow Preferences</h2>
            <p className="text-sm text-white/40 mb-8">Tune your scheduling to match how you work.</p>
            <form onSubmit={handleAction(updatePreferences, "Preferences saved.")} className="space-y-8">
              <div className="grid grid-cols-2 gap-5">
                <FormInput label="Work Start Time" type="time" name="workStartTime" defaultValue={user.preferences?.workStartTime || "09:00"} />
                <FormInput label="Work End Time" type="time" name="workEndTime" defaultValue={user.preferences?.workEndTime || "17:00"} />
              </div>
              <div className="grid grid-cols-3 gap-5">
                <FormInput label="Focus Session (mins)" type="number" name="sessionLength" defaultValue={user.preferences?.sessionLength || 60} />
                <FormInput label="Break Length (mins)" type="number" name="breakLength" defaultValue={user.preferences?.breakLength || 15} />
                <FormInput label="Breaks Per Day" type="number" name="breaksPerDay" defaultValue={user.preferences?.breaksPerDay || 3} />
              </div>
              <div className="grid grid-cols-3 gap-5">
                <FormInput label="Max Tasks / Day" type="number" name="maxTasksPerDay" defaultValue={user.preferences?.maxTasksPerDay || 10} />
                <FormInput label="Default Task (mins)" type="number" name="defaultTaskDuration" defaultValue={user.preferences?.defaultTaskDuration || 30} />
                <FormInput label="Reminder (Days)" type="number" name="reminderDays" defaultValue={user.preferences?.reminderDays || 1} />
              </div>
              <FormInput label="Preferred Task Order" name="taskOrder" defaultValue={user.preferences?.taskOrder || "priority"} options={[
                { value: "priority", label: "By Priority" }, { value: "due_date", label: "By Due Date" }, { value: "duration", label: "By Shortest Duration" }
              ]} />
              
              <div className="space-y-3">
                <label className="text-sm font-medium text-white/50">Days Off</label>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map(day => (
                    <label key={day} className="flex items-center gap-2 cursor-pointer bg-white/5 border border-white/10 px-4 py-2 rounded-xl hover:bg-white/10 transition-colors">
                      <input type="checkbox" name="daysOff" value={day} defaultChecked={currentDaysOff.includes(day)} className="w-4 h-4 accent-blue-400 rounded" />
                      <span className="text-sm text-white/60">{day}</span>
                    </label>
                  ))}
                </div>
              </div>
              <SubmitBtn isPending={isPending} text="Save Preferences" />
            </form>
          </div>
        )}

        {/* ── SECURITY TAB ── */}
        {activeTab === 'security' && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-lg font-semibold text-white mb-1">Security</h2>
            <p className="text-sm text-white/40 mb-8">Update your password to keep your account secure.</p>
            <form onSubmit={handleAction(changePassword, "Password updated.")} className="space-y-5 max-w-md mb-12">
              <FormInput label="Current Password" type="password" name="currentPassword" required />
              <FormInput label="New Password" type="password" name="newPassword" required minLength={6} />
              <FormInput label="Confirm New Password" type="password" name="confirmPassword" required minLength={6} />
              <SubmitBtn isPending={isPending} text="Update Password" />
            </form>
            <div className="pt-8 border-t border-white/10">
              <h3 className="text-base font-semibold text-white mb-1">Delete Account</h3>
              <p className="text-sm text-white/40 mb-4">Permanently remove your account and all associated data.</p>
              <button onClick={() => setShowDeleteModal(true)} className="px-4 py-2 border border-red-500/20 bg-red-500/5 text-red-400 rounded-xl text-sm font-medium hover:bg-red-500/10 transition-colors">
                Delete Account...
              </button>
            </div>
          </div>
        )}

        {/* ── INTEGRATIONS TAB ── */}
        {activeTab === 'integrations' && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-lg font-semibold text-white mb-1">Integrations</h2>
            <p className="text-sm text-white/40 mb-8">Connect third-party services to your account.</p>
            <div className="border border-white/10 bg-white/[0.03] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 bg-white/5 border border-white/10 rounded-full flex items-center justify-center p-2.5 shrink-0">
                  <svg viewBox="0 0 24 24" className="w-full h-full"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                </div>
                <div><h3 className="font-semibold text-white text-sm">Google Workspace</h3><p className="text-xs text-white/40 mt-0.5">Sync your calendar and tasks.</p></div>
              </div>
              {user.hasGoogleConnected 
                ? <button onClick={handleDisconnectGoogle} disabled={isPending} className="px-4 py-2 border border-red-500/20 text-red-400 bg-red-500/5 hover:bg-red-500/10 rounded-xl text-sm font-medium transition-colors disabled:opacity-40">{isPending ? "Disconnecting..." : "Disconnect"}</button>
                : <button onClick={() => signIn('google')} className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-xl text-sm font-medium transition-colors">Connect Google</button>}
            </div>
          </div>
        )}
      </div>

      {/* ── DELETE MODAL ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-gray-950 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-7 animate-in zoom-in-95 duration-200 relative overflow-hidden">
            {deleteStage === 'initial' ? (
              <div className="animate-in fade-in duration-300">
                <div className="flex items-center gap-3 mb-4"><HelpCircle size={24} className="text-white/40" /><h2 className="text-lg font-semibold text-white">Delete Account?</h2></div>
                <p className="text-sm text-white/50 mb-8 leading-relaxed">Are you sure you want to delete your account? This will permanently erase all your data and cannot be undone.</p>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => { setShowDeleteModal(false); setDeleteStage('initial'); setDeleteError(null); }} className="px-5 py-2.5 text-white/50 hover:text-white/80 text-sm font-medium transition-colors">Cancel</button>
                  <button type="button" onClick={() => setDeleteStage('password')} className="px-5 py-2.5 bg-white/10 text-white hover:bg-white/15 rounded-xl text-sm font-medium transition-colors">Continue</button>
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in duration-300">
                <div className="flex items-center gap-3 mb-4"><AlertTriangle size={24} className="text-red-400" /><h2 className="text-lg font-semibold text-white">Confirm Deletion</h2></div>
                <p className="text-sm text-white/50 mb-6 leading-relaxed">Enter your password to permanently delete your account. This cannot be undone.</p>
                {deleteError && <div className="mb-4 p-3 bg-red-500/10 text-red-300 text-sm rounded-xl border border-red-500/20 flex items-center gap-2"><AlertCircle size={14} /> {deleteError}</div>}
                <form onSubmit={handleDeleteAccount}>
                  <div className="mb-6"><FormInput label="Password" type="password" name="password" required /></div>
                  <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => { setShowDeleteModal(false); setDeleteStage('initial'); setDeleteError(null); }} disabled={isPending} className="px-4 py-2 text-white/50 hover:text-white/80 text-sm font-medium transition-colors">Cancel</button>
                    <button type="submit" disabled={isPending} className="px-5 py-2.5 bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 rounded-xl text-sm font-medium transition-colors disabled:opacity-40 flex items-center gap-2">{isPending ? "Deleting..." : "Permanently Delete"}</button>
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