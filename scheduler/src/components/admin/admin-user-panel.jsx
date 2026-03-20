{/* view the user profiles */}
export default function UserPanel({ user, onClose }) {
  if (!user) return null;

  const status = user.isBanned ? "Banned" : "Active";

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm"
      onClick={onClose} // clicking outside closes
    >
      <div
        className="h-full w-96 flex flex-col bg-white/5 backdrop-blur-xl border-l border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
      >
        {/* Header */}
        <div className="p-6 flex items-center justify-between border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">User Details</h3>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* User Info */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* profile */}
          <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-white/10 flex items-center justify-center text-white font-semibold">
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

              <div>
                <h4 className="text-lg font-semibold text-white">{user.username}</h4>
                <p className="text-sm text-white/50"> {user.email} </p>

                <span
                  className={`inline-block mt-2 px-2 py-1 text-xs rounded-lg ${
                    user.isBanned
                      ? "bg-red-400/20 text-red-300"
                      : "bg-green-400/20 text-green-300"
                  }`}
                >
                  {status}
                </span>
              </div>
          </div>

          {/* Activity Stats */}
          <div>
            <p className="text-xs uppercase text-white/40 tracking-wider mb-3">
              Activity
            </p>

            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "Reports Made",
                  value: user._count?.reportsMade ?? 0,
                },
                {
                  label: "Reports Received",
                  value: user._count?.reportsReceived ?? 0,
                },
                {
                  label: "Appeals",
                  value: user._count?.appeals ?? 0,
                },
                {
                  label: "Created",
                  value: new Date(user.createdAt).toLocaleDateString(),
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="p-3 rounded-xl bg-white/5 border border-white/10"
                >
                  <p className="text-sm font-semibold text-white">
                    {item.value}
                  </p>
                  <p className="text-xs text-white/40">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-white/10 border-t mt-auto">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}