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
      className="fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 border-l"
      onClick={onClose} //click outside closes
    >
        <div className="p-6" onClick={(e) => e.stopPropagation()} >
            {/*prevent closing when clicking inside*/}
            <h3 className="text-xl font-semibold mb-4">
                Report Details
            </h3>

            <h3 className="text-l font-bold mb-4">
                <p><strong>Report ID:</strong> {report.id} </p>
            </h3>

            <div className="space-y-2">
            <p><strong>Reported User:</strong> {report.reportedUser.username}</p>
            <p><strong>Reported By: </strong> {report.reportedBy.username}</p>
            <p><strong>Description: </strong> {report.description}</p>
            <p><strong>Status: </strong> {report.status}</p>
            <p>
                <strong>Handled By:</strong>{" "}
                {report.handledBy ? report.handledBy.username : "Not handled yet"}
            </p>
            {report.reportedUser.isBanned && (
                <p>
                    <strong>Ban Expires:</strong>{" "}
                    {report.reportedUser.banExpires
                    ? new Date(report.reportedUser.banExpires).toLocaleString()
                    : "Permanent"}
                </p>
            )}
            </div>

            {/* load the action panel for the responses */}
            <div className="space-x-2">
                <button onClick={() => setShowReportAction(true)}
                    //report action panel to ban or temp ban account
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-green-600"
                >
                    Action
                </button>
            </div>

            <button onClick={onClose}
                className="mt-6 w-full bg-gray-800 text-white py-2 rounded hover:bg-gray-700 transition"
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
  );
}

function ReportActionModal( {report, onClose, banUser} ) {
    return(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={onClose}   
        >
            <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-xl font-bold mb-4">Report Action</h2>

                {/* Send as a notification afterwards */}
                <textarea
                    placeholder="Reasoning (If needed)"
                    className="w-full border p-2 rounded mb-4"
                />

                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 border rounded">
                        Cancel
                    </button>

                    <button onClick={() => banUser(report.reportedUser, "TEMP", 7)}
                        className="bg-yellow-500 text-white px-3 py-2 rounded"
                    >
                        Temp Ban (7 days)
                    </button>

                    <button
                        onClick={() => {
                            banUser(report.reportedUser, "PERMANENT")}}
                        className="bg-red-600 text-white px-3 py-2 rounded"
                        disabled={!report.reportedUser?.id}
                    >
                        Permanent Ban
                    </button>

                    <button
                        onClick={() => banUser(report.reportedUser, "UNBAN")}
                        className="bg-green-600 text-white px-3 py-2 rounded"
                    >
                        Unban
                    </button>
                </div>
            </div>
        </div>
    )
}