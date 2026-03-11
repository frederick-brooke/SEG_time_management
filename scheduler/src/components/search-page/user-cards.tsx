"use client";

export default function UserCard({ user, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 p-3 hover:bg-gray-100 cursor-pointer transition"
    >
      {/* profile image */}
      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600 overflow-hidden">
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

      {/* user info */}
      <div className="flex flex-col">
        <span className="font-medium text-sm">{user.username}</span>

        {user.fname && user.lname && (
          <span className="text-xs text-gray-500">
            {user.fname} {user.lname}
          </span>
        )}
      </div>
    </div>
  );
}