{/* view the user profiles */}
export default function UserPanel({ user, onClose }) {
  if (!user) return null;

  const statusColor = user.isBanned ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800";

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/30"
      onClick={onClose} // clicking outside closes
    >
      <div
        className="h-full w-96 bg-white shadow-2xl border-l overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
      >
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between">
          <h3 className="text-xl font-semibold">User Details</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            ✕
          </button>
        </div>

        {/* User Info */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div>
              {/* profile image */}
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600 overflow-hidden ">
                {user.pfp ? (
                  <img
                    src={user.pfp}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>
                    {user.fname?.[0] ?? user.username?.[0] ?? ""}
                    {user.lname?.[0] ?? ""}
                  </span>
                )}
              </div>

              <h4 className="text-lg font-bold">{user.username}</h4>
              <p className="text-gray-500 text-sm">{user.email}</p>
              <span className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded ${statusColor}`}>
                {user.isBanned ? "Banned" : "Active"}
              </span>
            </div>
          </div>

          {/* Activity Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 p-3 rounded shadow-sm">
              <p className="font-semibold">{user._count?.reportsMade ?? 0}</p>
              <p className="text-gray-500">Reports Made</p>
            </div>
            <div className="bg-gray-50 p-3 rounded shadow-sm">
              <p className="font-semibold">{user._count?.reportsReceived ?? 0}</p>
              <p className="text-gray-500">Reports Received</p>
            </div>
            <div className="bg-gray-50 p-3 rounded shadow-sm">
              <p className="font-semibold">{user._count?.appeals ?? 0}</p>
              <p className="text-gray-500">Appeals Made</p>
            </div>
            <div className="bg-gray-50 p-3 rounded shadow-sm">
              <p className="font-semibold">{new Date(user.createdAt).toLocaleDateString()}</p>
              <p className="text-gray-500">Created At</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t mt-auto space-y-2">
          <button
            onClick={onClose}
            className="w-full border py-2 rounded-lg hover:bg-gray-100 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}