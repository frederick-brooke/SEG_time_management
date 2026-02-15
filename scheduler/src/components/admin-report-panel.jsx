import { useState } from "react";

//view the information for each report
export default function ReportPanel({ report, onClose }) {
  if (!report) return null;

  const [showReportAction, setShowReportAction] = useState(null);

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
                onClose={() => setShowReportAction(false)}
            />
        )}
    </div>
  );
}

function ReportActionModal( {onClose} ) {
    return(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-xl">
            <h2 className="text-xl font-bold mb-4">Report User</h2>

            <textarea
                placeholder="Additional details (optional)"
                className="w-full border p-2 rounded mb-4"
            />

                <div className="flex justify-end gap-2">
                    <button
                    onClick={onClose}
                    className="px-4 py-2 border rounded"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )
    
}