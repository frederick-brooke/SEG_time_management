'use client';

/**
 * Client-side Settings page.
 * Provides a tabbed settings interface for account, preferences,
 * privacy, security, and integrations, including forms and modals
 * for updating user configuration and account management actions.
 */

import { useState, useTransition } from "react";
import { updateAccountDetails, changePassword, disconnectGoogle, updatePreferences, deleteAccount } from "@/app/actions/settings";
import { updateLocationHidden } from "@/app/actions/updateUserLocation";
import { signIn, signOut } from "next-auth/react";
import { Key, User, Globe, AlertCircle, CheckCircle2, Sliders, AlertTriangle, HelpCircle, MapPin } from "lucide-react";
import LunarThemeWrapper from "@/components/layout/LunarThemeWrapper";
import SetLocationModal from "@/components/map/SetLocationModal";
import { TabKey } from "@/types/settings";

interface SettingsClientProps {
  user: {
    username: string;
    email: string;
    hasPassword?: boolean;
    hasGoogleConnected: boolean;
    preferences: any;
    location: { lat: number; lng: number } | null;
    city: string | null;
    country: string | null;
    locationHidden: boolean;
  }
}

// UI Sub-Components 
function FormInput({ label, type = "text", name, defaultValue, required, pattern, minLength, options }: any) {
  const inputCls = "w-full bg-[#0a0f1d] border border-white/10 text-white placeholder-white/25 p-3 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-colors appearance-none";
  return (
    <div className="space-y-2">
      <label className="lunar-label block">{label}</label>
      {options ? (
        <Select name={name} defaultValue={defaultValue} className={inputCls}>
          {options.map((opt: any) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </Select>
      ) : (
        <input type={type} name={name} defaultValue={defaultValue} required={required} pattern={pattern} minLength={minLength} className={inputCls} />
      )}
    </div>
  );
}

function StatusMessage({ error, success }: { error: string | null, success: string | null }) {
  if (error) return <div className="mb-6 lunar-item-error px-4 py-3 rounded-xl flex items-center gap-3 text-sm"><AlertCircle size={16} /> {error}</div>;
  if (success) return <div className="mb-6 lunar-item-success px-4 py-3 rounded-xl flex items-center gap-3 text-sm"><CheckCircle2 size={16} /> {success}</div>;
  return null;
}

// Main Component
export function SettingsClient({ user }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('account');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStage, setDeleteStage] = useState<'initial' | 'password'>('initial');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [locationHidden, setLocationHidden] = useState(user.locationHidden);

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const currentDaysOff = user.preferences?.daysOff || [];

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
    { key: 'privacy', label: 'Privacy', icon: MapPin },
    { key: 'security', label: 'Security', icon: Key },
    { key: 'integrations', label: 'Integrations', icon: Globe },
  ] as const;

  return (
    <LunarThemeWrapper>
      <div className="flex flex-col md:flex-row gap-6 relative">

        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0 flex flex-row md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {tabs.map(({ key, label, icon: Icon }) => (
            <Button 
              key={key} 
              onClick={() => { setActiveTab(key as TabKey); setError(null); setSuccess(null); }} 
              className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold text-sm transition-all duration-300 whitespace-nowrap ${
                activeTab === key 
                  ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]' 
                  : 'text-white/40 hover:bg-white/5 hover:text-white border border-transparent'
              }`}
            >
              <Icon size={16} /> {label}
            </Button>
          ))}
        </div>

        {/* Content Panel */}
        <div className="flex-1 lunar-card p-6 md:p-10 min-h-[400px] relative overflow-hidden">
          <div className="relative z-10">
            <StatusMessage error={error} success={success} />

            {/* Account Tab */}
            {activeTab === 'account' && (
              <div className="animate-in fade-in duration-300">
                <h2 className="lunar-header mb-2">Account Details</h2>
                <p className="lunar-value mb-8">Update your orbital identification.</p>
                <form onSubmit={handleAction(updateAccountDetails, "Account details updated.")} className="space-y-6 max-w-md">
                  <FormInput label="Username" name="username" defaultValue={user.username} required pattern="^[a-zA-Z0-9_-]{3,20}$" />
                  <FormInput label="Email Address" type="email" name="email" defaultValue={user.email} required />
                  <Button disabled={isPending} type="submit" className="lunar-button-primary mt-4">{isPending ? "Saving..." : "Save Changes"}</Button>
                </form>
              </div>
            )}

            {/* Preferences tab */}
            {activeTab === 'preferences' && (
              <div className="animate-in fade-in duration-300">
                <h2 className="lunar-header mb-2">Workflow Configuration</h2>
                <p className="lunar-value mb-8">Tune your scheduling to match how you orbit.</p>
                <form onSubmit={handleAction(updatePreferences, "Preferences saved.")} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormInput label="Start Orbit" type="time" name="workStartTime" defaultValue={user.preferences?.workStartTime || "09:00"} />
                    <FormInput label="End Orbit" type="time" name="workEndTime" defaultValue={user.preferences?.workEndTime || "17:00"} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <FormInput label="Focus (mins)" type="number" name="sessionLength" defaultValue={user.preferences?.sessionLength || 60} />
                    <FormInput label="Rest (mins)" type="number" name="breakLength" defaultValue={user.preferences?.breakLength || 15} />
                    <FormInput label="Daily Rests" type="number" name="breaksPerDay" defaultValue={user.preferences?.breaksPerDay || 3} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <FormInput label="Max Tasks/Day" type="number" name="maxTasksPerDay" defaultValue={user.preferences?.maxTasksPerDay || 10} />
                    <FormInput label="Default (mins)" type="number" name="defaultTaskDuration" defaultValue={user.preferences?.defaultTaskDuration || 30} />
                    <FormInput label="Reminder (Days)" type="number" name="reminderDays" defaultValue={user.preferences?.reminderDays || 1} />
                  </div>
                  <FormInput label="Gravity (Task Sort)" name="taskOrder" defaultValue={user.preferences?.taskOrder || "priority"} options={[
                    { value: "priority", label: "By Priority" }, { value: "due_date", label: "By Due Date" }, { value: "duration", label: "By Shortest Duration" }
                  ]} />
                  
                  <div className="space-y-3">
                    <label className="lunar-label block">Rest Days</label>
                    <div className="flex flex-wrap gap-3">
                      {daysOfWeek.map(day => (
                        <label key={day} className="flex items-center gap-2 cursor-pointer bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl hover:bg-white/10 transition-colors">
                          <input type="checkbox" name="daysOff" value={day} defaultChecked={currentDaysOff.includes(day)} className="w-4 h-4 rounded bg-[#0a0f1d] border-white/20 accent-blue-500" />
                          <span className="text-sm font-medium text-white/80">{day.substring(0, 3)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <Button disabled={isPending} type="submit" className="lunar-button-primary mt-4">{isPending ? "Configuring..." : "Update Preferences"}</Button>
                </form>
              </div>
            )}

            {/* Privacy tab */}
            {activeTab === 'privacy' && (
              <div className="animate-in fade-in duration-300">
                <h2 className="lunar-header mb-2">Location & Privacy</h2>
                <p className="lunar-value mb-8">Control your location visibility to friends.</p>

                {/* Current Location Display */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
                  <h3 className="font-semibold text-white mb-3">Your Location</h3>
                  {user.location ? (
                    <p className="text-sm text-white/70 mb-4">
                      📍 {user.city && user.country ? `${user.city}, ${user.country}` : `${user.location.lat.toFixed(4)}, ${user.location.lng.toFixed(4)}`}
                    </p>
                  ) : (
                    <p className="text-sm text-white/70 mb-4">No location set</p>
                  )}
                  <Button
                    onClick={() => setIsLocationModalOpen(true)}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    📍 Edit Location
                  </Button>
                </div>

                {/* Location Visibility Toggle */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white mb-1">Hide Location from Friends</h3>
                      <p className="text-sm text-white/50">Friends won't see your location on the friend map</p>
                    </div>
                    <Button
                      type="button"
                      onClick={() => {
                        setLocationHidden(!locationHidden);
                        startTransition(async () => {
                          try {
                            const result = await updateLocationHidden(!locationHidden);
                            if (!result.success) {
                              setError(result.error || "Failed to update location visibility");
                              setLocationHidden(locationHidden);
                            } else {
                              setSuccess("Location visibility updated.");
                            }
                          } catch (err: any) {
                            setError(err.message);
                            setLocationHidden(locationHidden);
                          }
                        });
                      }}
                      disabled={isPending}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        locationHidden ? "bg-indigo-600" : "bg-white/10"
                      } disabled:opacity-50`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          locationHidden ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Security tab */}
            {activeTab === 'security' && (
              <div className="animate-in fade-in duration-300">
                <h2 className="lunar-header mb-2">Security</h2>
                <form onSubmit={handleAction(changePassword, "Password updated.")} className="space-y-6 max-w-md mb-12">
                  <FormInput label="Current Password" type="password" name="currentPassword" required />
                  <FormInput label="New Password" type="password" name="newPassword" required minLength={6} />
                  <FormInput label="Confirm Password" type="password" name="confirmPassword" required minLength={6} />
                  <Button disabled={isPending} type="submit" className="lunar-button-primary mt-4">{isPending ? "Encrypting..." : "Update Password"}</Button>
                </form>
                <div className="pt-8 border-t border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-2">Delete Account</h3>
                  <p className="text-sm text-white/50 mb-5">
                    Permanently remove your account and all associated data. This action cannot be undone.
                  </p>
                  <Button 
                    onClick={() => setShowDeleteModal(true)} 
                    className="px-5 py-2.5 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 rounded-xl text-sm font-medium transition-colors"
                  >
                    Delete Account
                  </Button>
                </div>
              </div>
            )}

            {/* Integrations tab */}
            {activeTab === 'integrations' && (
              <div className="animate-in fade-in duration-300">
                <h2 className="lunar-header mb-2">Integrations</h2>
                <p className="lunar-value mb-8">Connect third-party services to your command center.</p>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 backdrop-blur-sm">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center p-3 shrink-0 shadow-lg">
                      <svg viewBox="0 0 24 24" className="w-full h-full"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    </div>
                    <div><h3 className="font-semibold text-white text-lg">Google Workspace</h3><p className="text-sm text-white/50 mt-1">Sync your terrestrial calendar and tasks.</p></div>
                  </div>
                  {user.hasGoogleConnected 
                    ? <Button onClick={handleDisconnectGoogle} disabled={isPending} className="lunar-item-error px-5 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-40 text-sm">Disconnect</Button>
                    : <Button onClick={() => signIn('google')} className="bg-white text-black px-5 py-2.5 hover:bg-gray-200 rounded-xl font-medium transition-colors text-sm">Connect Google</Button>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Delete modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0a0f]/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="lunar-card w-full max-w-md p-8 animate-in zoom-in-95 duration-200 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600/50 to-red-400" />
              {deleteStage === 'initial' ? (
                <div className="animate-in fade-in duration-300">
                  <div className="flex items-center gap-3 mb-4"><HelpCircle size={28} className="text-white/40" /><h2 className="lunar-header">Initiate Self-Destruct?</h2></div>
                  <p className="lunar-value mb-8 leading-relaxed">Are you absolutely sure you want to delete your account? This will permanently erase your orbit and cannot be undone.</p>
                  <div className="flex justify-end gap-3">
                    <Button type="button" onClick={() => { setShowDeleteModal(false); setDeleteStage('initial'); setDeleteError(null); }} className="lunar-button-ghost">Abort</Button>
                    <Button type="button" onClick={() => setDeleteStage('password')} className="lunar-item-error px-5 py-2.5 rounded-xl font-medium transition-colors">Yes, Continue</Button>
                  </div>
                </div>
              ) : (
                <div className="animate-in fade-in duration-300">
                  <div className="flex items-center gap-3 mb-4"><AlertTriangle size={28} className="text-red-400" /><h2 className="lunar-header text-red-400">Authorization Required</h2></div>
                  <p className="lunar-value mb-6">Enter your password to confirm permanent deletion.</p>
                  {deleteError && <div className="mb-4 lunar-item-error px-4 py-3 rounded-xl flex items-center gap-2"><AlertCircle size={16} /> {deleteError}</div>}
                  <form onSubmit={handleDeleteAccount}>
                    <div className="mb-8"><FormInput label="Password" type="password" name="password" required /></div>
                    <div className="flex justify-end gap-3">
                      <Button type="button" onClick={() => { setShowDeleteModal(false); setDeleteStage('initial'); setDeleteError(null); }} disabled={isPending} className="lunar-button-ghost">Cancel</Button>
                      <Button type="submit" disabled={isPending} className="lunar-item-error px-5 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-40 flex items-center gap-2">{isPending ? "Deleting..." : "Permanently Delete"}</Button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Location Modal */}
        <SetLocationModal
          isOpen={isLocationModalOpen}
          onClose={() => setIsLocationModalOpen(false)}
          initialLocation={user.location}
          initialHidden={user.locationHidden}
        />
      </div>
    </LunarThemeWrapper>
  );
}