"use client";

export default function UserCard( {user, onClick} ) {

  return (
    <div
      onClick={onClick}
      className={`border rounded-lg p-4 shadow hover:shadow-lg transition cursor-pointer bg-white relative`}
    >
      <div className="w-32 h-32 shrink-0 bg-gray-100 rounded-full flex items-center justify-center text-4xl font-bold text-gray-500 overflow-hidden border-4 border-white shadow-md">
        {user.pfp ? (
          <img src={user.pfp} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <span>{user.fname?.[0] ?? user.username?.[0] ?? ""}{user.lname?.[0] ?? ""}</span>
        )}
      </div>

      <h3 className="font-semibold text-lg mb-2">{user.username}</h3>
      {user.fname && user.lname && (
        <p className="text-sm text-gray-500 mb-1">
          {user.fname} {user.lname}
        </p>
      )}
    </div>
  );
}