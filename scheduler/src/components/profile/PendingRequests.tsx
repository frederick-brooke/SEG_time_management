'use client';

import { useFormStatus } from "react-dom";
import { Check, X } from "lucide-react";
import { acceptFriendRequest, rejectFriendRequest } from "@/src/app/actions/profile"; // Adjust path if needed

/**
 * Form status wrapper for accepting a friend request.
 * * @param {Object} props
 * @param {string} props.requestId - The ID of the friend request.
 * @return {JSX.Element} The accept button.
 */
function AcceptButton({ requestId }: { requestId: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className={`bg-black text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
        pending ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-800"
      }`}>
      <Check size={14} /> {pending ? "Accepting..." : "Accept"}
    </button>
  );
}

/**
 * Form status wrapper for rejecting a friend request.
 * * @return {JSX.Element} The reject button.
 */
function RejectButton() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className={`bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        pending ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
      }`}
    >
      <X size={14} />
    </button>
  );
}

/**
 * Renders the list of incoming friend requests.
 * * @param {Object} props - Component props.
 * @param {Array} props.requests - Array of incoming request objects.
 * @return {JSX.Element | null} The pending requests container, or null if no requests.
 */
export default function PendingRequests({ requests }: { requests: any[] }) {
  if (!requests || requests.length === 0) return null;

  return (
    <div className="mb-8 bg-white border border-red-100 rounded-2xl p-6 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-red-400" />
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900">
        Pending Friend Requests
        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{requests.length}</span>
      </h2>
      <div className="space-y-3">
        {requests.map((req: any) => (
          <div key={req.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-300 rounded-full overflow-hidden">
                {req.sender.pfp ? (
                  <img src={req.sender.pfp} alt={req.sender.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600 font-bold">
                    {req.sender.fname?.[0] || req.sender.username[0]}
                  </div>
                )}
              </div>
              <div>
                <p className="font-bold text-gray-900">{req.sender.fname || req.sender.username} {req.sender.lname}</p>
                <p className="text-xs text-gray-500">@{req.sender.username}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <form action={acceptFriendRequest.bind(null, req.id)}>
                <AcceptButton requestId={req.id} />
              </form>
              <form action={rejectFriendRequest.bind(null, req.id)}>
                <RejectButton />
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}