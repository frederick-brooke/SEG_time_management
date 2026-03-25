'use client';

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { AlertTriangle, ShieldOff, X } from "lucide-react";
import { LunarCard } from "@/components/ui/lunar-card";
import LunarThemeWrapper from "@/components/layout/LunarThemeWrapper";
import { useSession } from "next-auth/react";

export default function BannedPage() {
  const { data: session, update } = useSession();
  const [banInfo, setBanInfo]       = useState(null);
  const [showAppeal, setShowAppeal] = useState(false);

  useEffect(() => {
    async function fetchBanInfo() {
      try {
        const res = await fetch("/api/ban-info", { credentials: "include" });

        if (!res.ok) {
          if (res.status === 401) {
            setBanInfo({ reason: "You must be logged in", expires: null });
            return;
          }
          const text = await res.text();
          throw new Error(text || "Failed to fetch");
        }

        setBanInfo(await res.json());
      } catch (err) {
        console.error(err);
      }
    }

    fetchBanInfo();

	// Re-fetch the session on mount so the token is always fresh
	update().then((updatedSession) => {
		if (!updatedSession?.user?.isBanned) {
		window.location.href = "/dashboard";
		}
	});
  }, []);

  if (!banInfo) {
    return (
      <LunarThemeWrapper>
        <div className="min-h-screen flex items-center justify-center">
          <p className="lunar-page-subtitle text-white/30 animate-pulse text-sm">Loading…</p>
        </div>
      </LunarThemeWrapper>
    );
  }

  return (
    <LunarThemeWrapper>
      <div className="min-h-screen flex items-center justify-center px-4">
        <LunarCard
          variant="purple"
          className="w-full max-w-md p-7 space-y-6 hover:-translate-y-0"
        >
          {!showAppeal ? (
            <BanInfo
              banInfo={banInfo}
              onAppeal={() => setShowAppeal(true)}
            />
          ) : (
            <AppealForm
              reportId={banInfo?.reportId}
              onClose={() => setShowAppeal(false)}
            />
          )}
        </LunarCard>
      </div>
    </LunarThemeWrapper>
  );
}

/*  Ban Info View  */

function BanInfo({ banInfo, onAppeal }) {
  const isPermanent = !banInfo.expires;

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-red-500/15 border border-red-500/25 p-2.5 rounded-xl">
          <ShieldOff className="text-red-400 w-5 h-5" />
        </div>
        <div>
          <h1 className="lunar-header text-lg font-black text-white tracking-tight">
            Account Banned
          </h1>
          <p className="lunar-page-subtitle text-xs text-white/40 mt-0.5">
            Your access has been restricted
          </p>
        </div>
      </div>

      <div className="border-t border-white/10" />

      {/* Ban Details */}
      <div className="space-y-3">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
          <div>
            <p className="lunar-page-subtitle text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">
              Reason
            </p>
            <p className="text-sm text-white/80">{banInfo.reason}</p>
          </div>

          <div className="border-t border-white/10" />

          <div>
            <p className="lunar-page-subtitle text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">
              Ban Expires
            </p>
            <p className={`text-sm font-semibold ${isPermanent ? "text-red-400" : "text-amber-400"}`}>
              {isPermanent
                ? "Permanent"
                : new Date(banInfo.expires).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Warning note */}
        <div className="flex items-start gap-2 px-1">
          <AlertTriangle className="text-amber-400/60 w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <p className="lunar-page-subtitle text-xs text-white/30 leading-relaxed">
            If you believe this ban was issued in error, you can submit an appeal below.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 pt-1">
        <button
          onClick={onAppeal}
          className="lunar-page-subtitle w-full py-2.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-bold shadow-[0_0_20px_rgba(59,130,246,0.25)] hover:shadow-[0_0_28px_rgba(59,130,246,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          Submit Appeal
        </button>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="lunar-page-subtitle w-full py-2.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 hover:text-white/80 transition-all"
        >
          Sign Out
        </button>
      </div>
    </>
  );
}

/*  Appeal Form View */

function AppealForm({ reportId, onClose }) {
  const [description, setDescription] = useState("");
  const [loading, setLoading]         = useState(false);

  async function handleSubmit() {
    try {
      setLoading(true);

      const res = await fetch("/api/appeal", {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        body:        JSON.stringify({ description, reportId }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to submit appeal");

      alert("Appeal submitted. Please wait while an admin reviews it.");
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to submit appeal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="lunar-header text-lg font-black text-white tracking-tight">
            Submit Appeal
          </h2>
          <p className="lunar-page-subtitle text-xs text-white/40 mt-1">
            Explain why you believe this ban was issued incorrectly.
          </p>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white/80 hover:bg-white/10 transition-all flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="border-t border-white/10" />

      {/* Textarea */}
      <div>
        <label className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2 lunar-page-subtitle">
          Your Appeal
        </label>
        <textarea
          placeholder="Provide details about your appeal…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-base placeholder:text-white/20 focus:outline-none focus:border-purple-400/50 transition-colors resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="lunar-page-subtitle px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white/80 text-sm transition-all"
        >
          Cancel
        </button>

        <button
          onClick={handleSubmit}
          disabled={!description || loading}
          className="lunar-page-subtitle px-5 py-2 rounded-full bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm font-bold shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_28px_rgba(239,68,68,0.45)] hover:scale-105 active:scale-95 disabled:opacity-40 disabled:scale-100 disabled:shadow-none transition-all"
        >
          {loading ? "Submitting…" : "Submit Appeal"}
        </button>
      </div>
    </>
  );
}