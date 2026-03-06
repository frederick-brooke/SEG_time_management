"use client";

export default function UserCard( {user, onClick} ) {

  return (
    <div
      onClick={onClick}
      className={`border rounded-lg p-4 shadow hover:shadow-lg transition cursor-pointer bg-white relative`}
    >
      <h3 className="font-semibold text-lg mb-2">{user.username}</h3>
      {user.fname && user.lname && (
        <p className="text-sm text-gray-500 mb-1">
          {user.fname} {user.lname}
        </p>
      )}
    </div>
  );
}