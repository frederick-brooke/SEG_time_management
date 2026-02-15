{/* view the information for each report */}
export default function UserPanel({ report, onClose }) {
  if (!report) return null;

  return (
    <div
      className="fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 border-l"
      onClick={onClose} //click outside closes
    >
      <div
        className="p-6"
        onClick={(e) => e.stopPropagation()} //prevent closing when clicking inside
      >
        <h3 className="text-xl font-semibold mb-4">
          Report Details
        </h3>

        <h3 className="text-l font-bold mb-4">
          <p><strong>Report ID:</strong> {report.id} </p>
        </h3>

        <div className="space-y-2">
          <p><strong>Reported User:</strong> {report.reportedUserId}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {user.role}</p>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full bg-gray-800 text-white py-2 rounded hover:bg-gray-700 transition"
        >
          Close
        </button>
      </div>
    </div>
  );
}