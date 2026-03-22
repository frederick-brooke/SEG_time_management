'use client';

import { Calendar, Pencil, Trash2 } from "lucide-react";
import { formatEventDate } from "@/lib/format";

/**
 * Displays a scrollable list of upcoming group events.
 * Allows any group member to edit or delete shared events.
 *
 * @param {object} props - The component props.
 * @param {any[]} props.events - Array of group event objects.
 * @param {(event: any) => void} props.onEdit - Callback function to open the edit modal for a specific event.
 * @param {(groupId: string) => void} props.onDelete - Callback function to delete a specific event by its groupEventGroupId.
 * @return {JSX.Element} The rendered list of group events.
 */
export default function GroupEvents({ events, onEdit, onDelete }: any) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Calendar size={20} className="text-green-600" /> Group Events ({events.length})
      </h2>
      {events.length > 0 ? (
        <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
          {events.map((event: any) => (
            <div key={event.id} className="flex items-start justify-between p-4 bg-gradient-to-r from-purple-50 to-white border border-purple-100 rounded-lg gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{event.title}</h3>
                {event.description && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{event.description}</p>}
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className="text-xs text-gray-500">📅 {formatEventDate(event.start)}</span>
                  <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium">{event.category}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => onEdit(event)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit event"><Pencil size={14} /></button>
                <button onClick={() => onDelete(event.groupEventGroupId)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete event"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">No events yet. Create one using the button above!</p>
      )}
    </div>
  );
}