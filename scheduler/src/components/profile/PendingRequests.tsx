'use client';

import { useTransition } from "react";
import { Check, X } from "lucide-react";
import { acceptFriendRequest, declineFriendRequest } from "@/app/actions/profile/friends";
import { resolveAvatarSrc } from "@/lib/avatar";


/**
 * Renders the list of incoming friend requests.
 * @param {object} props - Component props.
 * @param {Array} props.requests - Array of incoming request objects.
 * @return {JSX.Element | null} The pending requests container, or null if empty.
 */
export default function PendingRequests({ requests }: { requests: any[] }) {
  const [isPending, startTransition] = useTransition();

  if (!requests || requests.length === 0) return null;

  const handleAccept = (requestId: string) => {
    startTransition(async () => {
      await acceptFriendRequest(requestId);
    });
  };

  const handleReject = (requestId: string) => {
    startTransition(async () => {
      await declineFriendRequest(requestId);
    });
  };

  return (
    <div className="lunar-card p-6 relative overflow-hidden border-l-2 border-l-red-500/50">
      <h2 className="lunar-label mb-4 flex items-center gap-2">
        Pending Friend Requests
        <span className="lunar-item-error px-2 py-0.5 rounded-full border text-[10px]">
          {requests.length}
        </span>
      </h2>

      <div className="space-y-3">
        {requests.map((req: any) => {
          const avatarSrc = resolveAvatarSrc(req.sender.pfp);
          return (
          <div
            key={req.id}
            className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-full overflow-hidden border border-white/10">
                {req.sender.pfp ? (
                  <img
                    src={avatarSrc}
                    alt={req.sender.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/60 font-bold text-sm">
                    {req.sender.fname?.[0] || req.sender.username[0]}
                  </div>
                )}
              </div>
              <div>
                <p className="font-bold text-white text-sm">
                  {req.sender.fname || req.sender.username} {req.sender.lname}
                </p>
                <p className="text-xs text-blue-400">@{req.sender.username}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => handleAccept(req.sender.id)}
                disabled={isPending}
                className={`lunar-item-success flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-bold uppercase tracking-wider transition-colors ${
                  isPending ? "opacity-50 cursor-not-allowed" : "hover:bg-emerald-500/20"
                }`}
              >
                <Check size={14} /> {isPending ? "..." : "Accept"}
              </Button>

              <Button
                onClick={() => handleReject(req.sender.id)}
                disabled={isPending}
                className={`lunar-item-error flex items-center justify-center px-3 py-2 rounded-lg border transition-colors ${
                  isPending ? "opacity-50 cursor-not-allowed" : "hover:bg-red-500/20"
                }`}
              >
                <X size={14} />
              </Button>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
