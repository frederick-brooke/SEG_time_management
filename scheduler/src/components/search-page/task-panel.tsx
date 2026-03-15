{/* view the task informat */}
export default function TaskPanel({ user, onClose }) {
  if (!user) return null;

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
          User Details
        </h3>

        <div className="space-y-2">
          <p><strong>Username:</strong> {user.username}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {user.role}</p>
          <p><strong>Created at:</strong> {user.createdAt}</p>
          <p><strong>Total Reports made:</strong> {user.reportsMade.length}</p>
          <p><strong>Total Reports received:</strong> {user.reportsReceived.length}</p>
          <p><strong>Total Appeals made:</strong> {user.appeals.length}</p>
          <p><strong>Is banned:</strong> {String(user.isBanned)}</p>


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