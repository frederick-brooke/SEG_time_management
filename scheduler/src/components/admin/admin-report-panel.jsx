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

  return (
    <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose} // clicking backdrop closes
    >
        <div className="fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-40 border-l" onClick={onClose} >
            <div className="h-full overflow-y-auto p-6 space-y-6 text-sm" onClick={(e) => e.stopPropagation()} >
                {/*prevent closing when clicking inside*/}
                <h3 className="text-xl font-semibold mb-4">
                    Report Details
                </h3>

                <h3 className="text-l font-bold mb-4">
                    <p><strong>Report ID:</strong> {report.id} </p>
                </h3>

                <div className="border-t" />

            {/* Report Info */}
                <div className="grid grid-cols-2 gap-y-3">
                    <span className="text-gray-500">Reported User</span>
                    <span className="font-medium">{report.reportedUser.username}</span>

                    <span className="text-gray-500">Date Submitted</span>
                    <span className="font-medium">{new Date(report.createdAt).toLocaleString()}</span>

                    <span className="text-gray-500">Reported By</span>
                    <span className="font-medium">{report.reportedBy.username}</span>

                    <span className="text-gray-500">Status</span>
                    <span className="font-medium">{report.status}</span>

                    <span className="text-gray-500">Handled By</span>
                    <span className="font-medium">
                        {report.handledBy?.username ?? "Not handled yet"}
                    </span>

                    {report.status === "RESOLVED" && report.reportedUser.isBanned && (
                    <>
                        <span className="text-gray-500">Ban Expires</span>
                        <span className="font-medium">
                        {report.reportedUser.banExpires
                            ? new Date(report.reportedUser.banExpires).toLocaleString()
                            : "Permanent"}
                        </span>
                    </>
                    )}
                </div>

                <div className="border-t" />

                {/* Description */}
                <div>
                    <p className="text-gray-500 mb-1">Description</p>
                    <div className="bg-gray-50 border rounded-lg p-3 text-sm">
                    {report.description}
                    </div>
                </div>
                
                <div className="border-t" />

                {/* load the action panel for the responses */}
                {report.handledBy == null &&
                    <div className="space-y-2">
                        <button onClick={() => setShowReportAction(true)}
                            //report action panel to ban or temp ban account
                            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                        >
                            Take Action
                        </button>
                    </div>            
                }

                

                <button onClick={onClose}
                    className="w-full border py-2 rounded-lg hover:bg-gray-100 transition"
                >
                    Close
                </button>
            </div>    


            {showReportAction && (
                <ReportActionModal
                    report={report}
                    onClose={() => setShowReportAction(false)}
                    banUser={banUser}
                />
            )}
        </div>
    </div>
  );
}

function ReportActionModal( {report, onClose, banUser} ) {
    return(
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={onClose}   
        >
            <div className="bg-white w-full max-w-md p-6 space-y-4 rounded-xl shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-lg font-semi-bold">Report Action</h2>

                {/* Send as a notification afterwards */}
                <textarea
                    placeholder="Reasoning (Optional)"
                    className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div className="space-y-2">
                    <button
                        onClick={() => banUser(report.reportedUser, "TEMP", 7)}
                        className="w-full bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600 transition"
                    >
                        Temporary Ban (7 days)
                    </button>

                    <button
                        onClick={() => banUser(report.reportedUser, "PERMANENT")}
                        className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition"
                        disabled={!report.reportedUser?.id}
                    >
                        Permanent Ban
                    </button>

                    <button
                        onClick={() => banUser(report.reportedUser, "UNBAN")}
                        className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
                    >
                        Unban
                    </button>
                </div>

                <button
                    onClick={onClose}
                    className="w-full border py-2 rounded-lg hover:bg-gray-100 transition"
                >
                    Cancel
                </button>
            </div>
        </div>
    )
}