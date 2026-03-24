import { useState } from "react";

//view the information for each report
export default function ReportPanel({ report, onClose, fetchReports }) {
  if (!report) return null;

  const [showReportAction, setShowReportAction] = useState(null);

    async function banUser(user, type, durationDays = null) {
        if (!user?.id) {
            alert(`Cannot ban user: user ID is missing.`);
            return;
        }

        await fetch(`/api/admin/users/${user.id}/ban`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type, durationDays, reportId: report.id  }),
        });

        if(type === "TEMP"){
            alert(`User ${user.username} Temporarily Banned`);
        } else if(type === "PERMANENT"){
            alert(`User ${user.username} Permanently Banned`);
        }
        else{
            alert(`User ${user.username} Unbanned`);
        }

        fetchReports();
    }

    const statusStyles = report.status === "RESOLVED" ? "bg-green-400/20 text-green-300" : report.status === "REJECTED" ? "bg-red-400/20 text-red-300" : "bg-yellow-400/20 text-yellow-300";

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="h-full w-96 flex flex-col bg-white/5 backdrop-blur-xl border-l border-white/10 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <h3 className="lunar-header text-lg font-semibold text-white">Report Details</h3>
                    <button onClick={onClose} className="text-white/50 hover:text-white transition">
                        ✕
                    </button>
                </div>

            {/* Content */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* Report Info */}
                <div className="space-y-3">
                    <div className="flex justify-between">
                    <span className="text-xs uppercase text-white/40 tracking-wider">Report ID</span>
                    <span className="font-medium text-white">{report.id}</span>
                    </div>

                    <div className="flex justify-between">
                    <span className="text-xs uppercase text-white/40 tracking-wider">Reported User</span>
                    <span className="font-medium text-white">{report.reportedUser.username}</span>
                    </div>

                    <div className="flex justify-between">
                    <span className="text-xs uppercase text-white/40 tracking-wider">Reported By</span>
                    <span className="font-medium text-white">{report.reportedBy.username}</span>
                    </div>

                    <div className="flex justify-between items-center">
                    <span className="text-xs uppercase text-white/40 tracking-wider">Status</span>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${statusStyles}`}>
                        {report.status}
                    </span>
                    </div>

                    <div className="flex justify-between">
                    <span className="text-xs uppercase text-white/40 tracking-wider">Handled By</span>
                    <span className="font-medium text-white">{report.handledBy?.username ?? "Not handled yet"}</span>
                    </div>

                    {report.status === "RESOLVED" && report.reportedUser.isBanned && (
                    <div className="flex justify-between">
                        <span className="text-xs uppercase text-white/40 tracking-wider">Ban Expires</span>
                        <span className="font-medium text-white">
                        {report.reportedUser.banExpires
                            ? new Date(report.reportedUser.banExpires).toLocaleString()
                            : "Permanent"}
                        </span>
                    </div>
                    )}
                </div>

                {/* Description */}
                <div className="space-y-1">
                    <p className="lunar-page-subtitle text-xs text-white/40 uppercase tracking-wider">Description</p>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white/80">
                    {report.description}
                    </div>
                </div>

                {/* Action Button */}
                {!report.handledBy && (
                    <button
                    onClick={() => setShowReportAction(true)}
                    className="lunar-page-subtitle w-full py-2 rounded-xl bg-blue-400 text-gray-900 font-medium hover:scale-[1.02] transition"
                    >
                    Take Action
                    </button>
                )}
            </div>

            {/* Close */}
            <div className="p-6 border-t border-white/10">
                <button onClick={onClose} className="lunar-page-subtitle w-full py-2 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 transition">
                    Close
                </button>
            </div>
      </div>

      {/* Report Action Modal */}
      {showReportAction && (
        <ReportActionModal report={report} onClose={() => setShowReportAction(false)} banUser={banUser} />
      )}
    </div>
  );
}

function ReportActionModal( {report, onClose, banUser} ) {
    return(
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white/5 w-full max-w-md p-6 space-y-4 rounded-xl shadow-2xl backdrop-blur-xl border border-white/10" onClick={(e) => e.stopPropagation()}>
                <h2 className="lunar-header text-lg font-semibold text-white">Report Action</h2>

                <textarea placeholder="Reasoning (Optional)" className="lunar-page-subtitle w-full bg-white/5 border border-white/10 text-white/80 rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"/>

                <div className="space-y-2">
                    <button onClick={() => banUser(report.reportedUser, "TEMP", 7)} className="w-full py-2 rounded-xl bg-yellow-400 text-gray-900 font-medium hover:scale-[1.02] transition">
                        Temporary Ban (7 days)
                    </button>

                    <button onClick={() => banUser(report.reportedUser, "PERMANENT")} className="w-full py-2 rounded-xl bg-red-400 text-gray-900 font-medium hover:scale-[1.02] transition" disabled={!report.reportedUser?.id}>
                        Permanent Ban
                    </button>

                    <button onClick={() => banUser(report.reportedUser, "UNBAN")} className="w-full py-2 rounded-xl bg-green-400 text-gray-900 font-medium hover:scale-[1.02] transition">
                        Unban
                    </button>
                </div>

                <button onClick={onClose} className="lunar-page-subtitle w-full py-2 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 transition">
                    Cancel
                </button>
            </div>
        </div>
    );
}