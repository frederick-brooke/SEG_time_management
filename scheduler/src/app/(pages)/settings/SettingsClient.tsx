'use client';

import { useState, useTransition } from "react";
import { updateAccountDetails, changePassword, disconnectGoogle, updatePreferences, deleteAccount } from "@/src/app/actions/settings";
import { signIn, signOut } from "next-auth/react";
import { Key, User, Globe, AlertCircle, CheckCircle2, Sliders, AlertTriangle, HelpCircle } from "lucide-react";

interface SettingsClientProps {
  user: {
    username: string;
    email: string;
    hasGoogleConnected: boolean;
    preferences: any;
  }
}

export function SettingsClient({ user }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<'account' | 'preferences' | 'security' | 'integrations'>('account');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal State for Deletion
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  // Tracking the two steps: initial question -> password entry
  const [deleteStage, setDeleteStage] = useState<'initial' | 'password'>('initial');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const currentDaysOff = user.preferences?.daysOff || [];

  const handleAction = (actionFn: (formData: FormData) => Promise<any>, successMsg: string) => async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null); setSuccess(null);
    const formData = new FormData(e.currentTarget);
    const form = e.currentTarget;
    
    startTransition(async () => {
      try {
        await actionFn(formData);
        setSuccess(successMsg);
        if (actionFn === changePassword) form.reset();
      } catch (err: any) {
        setError(err.message);
      }
    });
  };

  const handleDisconnectGoogle = () => {
    setError(null); setSuccess(null);
    startTransition(async () => {
      try {
        await disconnectGoogle();
        setSuccess("Google account disconnected.");
      } catch (err: any) {
        setError(err.message);
      }
    });
  };

  const handleDeleteAccount = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setDeleteError(null);
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      try {
        await deleteAccount(formData);
        await signOut({ callbackUrl: "/login" });
      } catch (err: any) {
        setDeleteError(err.message);
      }
    });
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteStage('initial'); // Reset back to first step
    setDeleteError(null);
  }

  return (
    <div className="flex flex-col md:flex-row gap-8 relative">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 shrink-0 space-y-2">
        <button onClick={() => { setActiveTab('account'); setError(null); setSuccess(null); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'account' ? 'bg-gray-900 text-white' : 'bg-transparent text-gray-600 hover:bg-gray-100'}`}>
          <User size={18} /> Account Details
        </button>
        <button onClick={() => { setActiveTab('preferences'); setError(null); setSuccess(null); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'preferences' ? 'bg-gray-900 text-white' : 'bg-transparent text-gray-600 hover:bg-gray-100'}`}>
          <Sliders size={18} /> Preferences
        </button>
        <button onClick={() => { setActiveTab('security'); setError(null); setSuccess(null); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'security' ? 'bg-gray-900 text-white' : 'bg-transparent text-gray-600 hover:bg-gray-100'}`}>
          <Key size={18} /> Security
        </button>
        <button onClick={() => { setActiveTab('integrations'); setError(null); setSuccess(null); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'integrations' ? 'bg-gray-900 text-white' : 'bg-transparent text-gray-600 hover:bg-gray-100'}`}>
          <Globe size={18} /> Integrations
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-8 shadow-sm min-h-[400px]">
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-3 border border-red-200">
            <AlertCircle size={20} /> {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-3 border border-green-200">
            <CheckCircle2 size={20} /> {success}
          </div>
        )}

        {/* --- ACCOUNT DETAILS TAB --- */}
        {activeTab === 'account' && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Account Details</h2>
            <form onSubmit={handleAction(updateAccountDetails, "Account details updated successfully.")} className="space-y-6 max-w-md">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Username</label>
                <input name="username" defaultValue={user.username} required pattern="^[a-zA-Z0-9_-]{3,20}$" className="w-full border border-gray-200 bg-gray-50 p-3 rounded-lg focus:ring-2 focus:ring-black outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Email Address</label>
                <input type="email" name="email" defaultValue={user.email} required className="w-full border border-gray-200 bg-gray-50 p-3 rounded-lg focus:ring-2 focus:ring-black outline-none" />
              </div>
              <button disabled={isPending} type="submit" className="bg-black text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50">
                {isPending ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        )}

        {/* --- PREFERENCES TAB --- */}
        {activeTab === 'preferences' && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Workflow Preferences</h2>
            <form onSubmit={handleAction(updatePreferences, "Preferences saved successfully.")} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Work Start Time</label>
                  <input type="time" name="workStartTime" defaultValue={user.preferences?.workStartTime || "09:00"} className="w-full border border-gray-200 bg-gray-50 p-3 rounded-lg focus:ring-2 focus:ring-black outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Work End Time</label>
                  <input type="time" name="workEndTime" defaultValue={user.preferences?.workEndTime || "17:00"} className="w-full border border-gray-200 bg-gray-50 p-3 rounded-lg focus:ring-2 focus:ring-black outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Focus Session (mins)</label>
                  <input type="number" name="sessionLength" defaultValue={user.preferences?.sessionLength || 60} className="w-full border border-gray-200 bg-gray-50 p-3 rounded-lg focus:ring-2 focus:ring-black outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Break Length (mins)</label>
                  <input type="number" name="breakLength" defaultValue={user.preferences?.breakLength || 15} className="w-full border border-gray-200 bg-gray-50 p-3 rounded-lg focus:ring-2 focus:ring-black outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Breaks Per Day</label>
                  <input type="number" name="breaksPerDay" defaultValue={user.preferences?.breaksPerDay || 3} className="w-full border border-gray-200 bg-gray-50 p-3 rounded-lg focus:ring-2 focus:ring-black outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Max Tasks / Day</label>
                  <input type="number" name="maxTasksPerDay" defaultValue={user.preferences?.maxTasksPerDay || 10} className="w-full border border-gray-200 bg-gray-50 p-3 rounded-lg focus:ring-2 focus:ring-black outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Default Task (mins)</label>
                  <input type="number" name="defaultTaskDuration" defaultValue={user.preferences?.defaultTaskDuration || 30} className="w-full border border-gray-200 bg-gray-50 p-3 rounded-lg focus:ring-2 focus:ring-black outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Reminder (Days before)</label>
                  <input type="number" name="reminderDays" defaultValue={user.preferences?.reminderDays || 1} className="w-full border border-gray-200 bg-gray-50 p-3 rounded-lg focus:ring-2 focus:ring-black outline-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Preferred Task Order</label>
                <select name="taskOrder" defaultValue={user.preferences?.taskOrder || "priority"} className="w-full border border-gray-200 bg-gray-50 p-3 rounded-lg focus:ring-2 focus:ring-black outline-none">
                  <option value="priority">By Priority</option>
                  <option value="due_date">By Due Date</option>
                  <option value="duration">By Shortest Duration</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700">Days Off</label>
                <div className="flex flex-wrap gap-3">
                  {daysOfWeek.map(day => (
                    <label key={day} className="flex items-center gap-2 cursor-pointer bg-gray-50 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                      <input type="checkbox" name="daysOff" value={day} defaultChecked={currentDaysOff.includes(day)} className="w-4 h-4 text-black focus:ring-black rounded" />
                      <span className="text-sm font-medium text-gray-700">{day}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button disabled={isPending} type="submit" className="bg-black text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50">
                {isPending ? "Saving..." : "Save Preferences"}
              </button>
            </form>
          </div>
        )}

        {/* --- SECURITY TAB --- */}
        {activeTab === 'security' && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Security</h2>
            <p className="text-sm text-gray-500 mb-6">Update your password to keep your account secure.</p>
            
            <form onSubmit={handleAction(changePassword, "Password updated successfully.")} className="space-y-6 max-w-md mb-12">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Current Password</label>
                <input type="password" name="currentPassword" required className="w-full border border-gray-200 bg-gray-50 p-3 rounded-lg focus:ring-2 focus:ring-black outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">New Password</label>
                <input type="password" name="newPassword" required minLength={6} className="w-full border border-gray-200 bg-gray-50 p-3 rounded-lg focus:ring-2 focus:ring-black outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Confirm New Password</label>
                <input type="password" name="confirmPassword" required minLength={6} className="w-full border border-gray-200 bg-gray-50 p-3 rounded-lg focus:ring-2 focus:ring-black outline-none" />
              </div>
              <button disabled={isPending} type="submit" className="bg-black text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50">
                {isPending ? "Saving..." : "Update Password"}
              </button>
            </form>

            {/* --- SIMPLIFIED ACCOUNT DELETION SECTION --- */}
            <div className="pt-8 border-t border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Account Deletion</h3>
              <p className="text-sm text-gray-600 mb-4">
                Permanently remove your account and all associated data.
              </p>
              <button 
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 border border-gray-200 bg-gray-50 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        )}

        {/* --- INTEGRATIONS TAB --- */}
        {activeTab === 'integrations' && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Integrations</h2>
            <div className="border border-gray-200 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white border border-gray-200 rounded-full flex items-center justify-center p-2 shrink-0">
                  <svg viewBox="0 0 24 24" className="w-full h-full"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Google Workspace</h3>
                  <p className="text-sm text-gray-500">Sync your calendar and tasks.</p>
                </div>
              </div>
              
              {user.hasGoogleConnected ? (
                <button 
                  onClick={handleDisconnectGoogle}
                  disabled={isPending}
                  className="px-4 py-2 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isPending ? "Disconnecting..." : "Disconnect"}
                </button>
              ) : (
                <button 
                  onClick={() => signIn('google')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Connect Google
                </button>
              )}
            </div>
          </div>
        )}

      </div>

      {/* --- TWO-STEP DELETE ACCOUNT CONFIRMATION MODAL --- */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            
            {/* --- STEP 1: ARE YOU SURE? --- */}
            {deleteStage === 'initial' && (
              <div className="animate-in fade-in duration-300">
                <div className="flex items-center gap-3 mb-4 text-gray-900">
                  <HelpCircle size={28} className="text-gray-500" />
                  <h2 className="text-xl font-bold">Delete Account?</h2>
                </div>
                <p className="text-gray-600 mb-8 lider-relaxed">
                  Are you absolutely sure you want to delete your account? This will permanently erase your data and cannot be undone.
                </p>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={closeDeleteModal} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">
                    No, Cancel
                  </button>
                  <button type="button" onClick={() => setDeleteStage('password')} className="px-5 py-2.5 bg-gray-900 text-white hover:bg-gray-800 rounded-lg font-medium transition-colors">
                    Yes, Continue
                  </button>
                </div>
              </div>
            )}

            {/* --- STEP 2: ENTER PASSWORD --- */}
            {deleteStage === 'password' && (
              <div className="animate-in fade-in duration-300">
                <div className="flex items-center gap-3 mb-4 text-red-600">
                  <AlertTriangle size={28} />
                  <h2 className="text-xl font-bold">Confirm Deletion</h2>
                </div>
                <p className="text-gray-600 mb-6 text-sm">
                  To proceed, please enter your password. This action is irreversible.
                </p>

                {deleteError && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 flex items-center gap-2">
                    <AlertCircle size={16} /> {deleteError}
                  </div>
                )}

                <form onSubmit={handleDeleteAccount}>
                  <div className="space-y-2 mb-6">
                    <label className="text-sm font-semibold text-gray-700">Enter your password</label>
                    <input 
                      type="password" 
                      name="password" 
                      required 
                      autoFocus
                      className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all" 
                      placeholder="Password"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={closeDeleteModal} disabled={isPending} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">
                      Cancel
                    </button>
                    <button type="submit" disabled={isPending} className="px-5 py-2.5 bg-red-600 text-white hover:bg-red-700 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2">
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