'use client';

import { Calendar, Pencil, Trash2 } from "lucide-react";
import { formatEventDate } from "@/lib/format"; // Adjust this path if your format.ts is located elsewhere

export interface ModuleEvent {
  id: string;
  moduleEventGroupId: string | null;
  title: string;
  description: string | null;
  start: Date;
  end: Date;
  category: string;
}

interface EventRowProps {
  event: ModuleEvent;
  isOwner: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Renders a single event row with optional owner edit/delete controls
 */
function EventRow({ event, isOwner, onEdit, onDelete }: EventRowProps) {
  return (
    <div className="flex items-start justify-between p-4 bg-gradient-to-r from-green-50 to-white border border-green-100 rounded-lg gap-3">
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 truncate">{event.title}</h3>
        {event.description && (
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{event.description}</p>
        )}
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <span className="text-xs text-gray-500">📅 {formatEventDate(event.start)}</span>
          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
            {event.category}
          </span>
        </div>
      </div>

      {isOwner && (
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onEdit}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit event"
            data-testid="edit-event-btn"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete event"
            data-testid="delete-event-btn"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

interface ModuleEventsProps {
  events: ModuleEvent[];
  isOwner: boolean;
  onEdit: (event: ModuleEvent) => void;
  onDelete: (groupId: string) => void;
}

export default function ModuleEvents({ events, isOwner, onEdit, onDelete }: ModuleEventsProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Calendar size={20} className="text-green-600" /> Upcoming Events ({events.length})
      </h2>
      
      {events.length > 0 ? (
        <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
          {events.map((event) => (
            <EventRow
              key={event.id}
              event={event}
              isOwner={isOwner}
              onEdit={() => onEdit(event)}
              onDelete={() => event.moduleEventGroupId && onDelete(event.moduleEventGroupId)}
            />
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">
          No events scheduled yet.{isOwner && " Create one using the button above!"}
        </p>
      )}
    </div>
  );
}