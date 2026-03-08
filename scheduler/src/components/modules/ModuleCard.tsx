import Link from "next/link";
import { Users, BookOpen } from "lucide-react";

interface ModuleCardProps {
  module: {
    id: string;
    name: string;
    description?: string;
    memberCount: number;
    maxMembers: number;
    userRole: string;
    joinPin?: string;
    creator: {
      username: string;
      fname?: string;
      lname?: string;
    };
  };
}

/**
 * Displays a module card with basic info and member count
 * @param {ModuleCardProps} props - Module data to display
 * @return {JSX.Element} - Module card component
 */
export function ModuleCard({ module }: ModuleCardProps) {
  const isOwner = module.userRole === 'OWNER';
  
  return (
    <div className="flex items-center gap-2 rounded-lg border p-4 bg-card shadow-sm hover:shadow-md transition-shadow">
      {/* Icon */}
      <div className="shrink-0 bg-blue-50 p-3 rounded-lg">
        <BookOpen className="text-blue-600" size={24} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-gray-900 truncate">
              {module.name}
            </h3>
            {module.description && (
              <p className="text-xs text-gray-500 truncate mt-0.5">
                {module.description}
              </p>
            )}
          </div>

          {/* Role Badge */}
          {isOwner && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100 font-semibold shrink-0">
              OWNER
            </span>
          )}
        </div>

        {/* Footer Info */}
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Users size={14} />
            <span>{module.memberCount}/{module.maxMembers}</span>
          </div>

          <span className="text-[10px] text-gray-400">
            by @{module.creator.username}
          </span>
        </div>
      </div>

      {/* View Button */}
      <Link
        href={`/modules/${module.id}`}
        className="shrink-0 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
      >
        View
      </Link>
    </div>
  );
}