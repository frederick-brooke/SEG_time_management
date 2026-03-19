import Link from "next/link";
import { Users, Crown } from "lucide-react";

//types
interface GroupCardProps {
  group: {
    id: string;
    name: string;
    description?: string | null;
    memberCount: number;
    userRole: string;
    creator: {
      username: string;
      fname?: string | null;
      lname?: string | null;
    };
  };
}


/**
 * Displays a group card with name, description, member count and owner badge
 * @param {GroupCardProps} props - Group data to display
 * @return {JSX.Element} - Group card component
 */
export function GroupCard({ group }: GroupCardProps) {
  const isOwner = group.userRole === "OWNER";

  return (
    <div className="flex items-center gap-3 rounded-lg border p-4 bg-card shadow-sm hover:shadow-md transition-shadow">

      {/* Icon */}
      <div className="shrink-0 bg-purple-50 p-3 rounded-lg">
        <Users className="text-purple-600" size={24} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-gray-900 truncate">{group.name}</h3>
            {group.description && (
              <p className="text-xs text-gray-500 truncate mt-0.5">{group.description}</p>
            )}
          </div>
          {isOwner && (
            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100 font-semibold shrink-0">
              <Crown size={10} /> Owner
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Users size={13} />
            <span>{group.memberCount} member{group.memberCount !== 1 ? "s" : ""}</span>
          </div>
          <span className="text-[10px] text-gray-400">
            by @{group.creator.username}
          </span>
        </div>
      </div>

      {/* View button */}
      <Link
        href={`/groups/${group.id}`}
        className="shrink-0 px-4 py-2 text-sm font-medium text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
      >
        View
      </Link>
    </div>
  );
}
