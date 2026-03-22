'use client';

import { Calendar, Pencil, Trash2 } from "lucide-react";
import { formatEventDate } from "@/lib/format";

//section constants
const CATEGORY_STYLES: Record<string, string> = {
  Social:   'bg-blue-500/10 text-blue-400 border-blue-500/20 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]',
  Study:    'bg-amber-500/10 text-amber-400 border-amber-500/20 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]',
  Lecture:  'bg-purple-500/10 text-purple-400 border-purple-500/20 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]',
  Exam:     'bg-red-500/10 text-red-400 border-red-500/20 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]',
  Personal: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]',
  Lab:      'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]',
};

const DEFAULT_CATEGORY_STYLE = 'bg-white/10 text-white rounded-full border border-white/20';

//section component

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
    <div className="lunar-card p-6 mb-6">
      <h2 className="lunar-label mb-4 flex items-center gap-2 text-sm text-white">
        <Calendar size={16} className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" /> Group Events ({events.length})
      </h2>
      {events.length > 0 ? (
        <div className="max-h-80 overflow-y-auto space-y-2 pr-1 lunar-scroll">
          {events.map((event: any) => {
            const tagStyle = CATEGORY_STYLES[event.category] || DEFAULT_CATEGORY_STYLE;
            
            return (
              <div key={event.id} className="flex items-start justify-between p-4 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all rounded-xl gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white truncate text-sm">{event.title}</h3>
                  {event.description && <p className="text-xs text-white/40 mt-1 line-clamp-2">{event.description}</p>}
                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    <span className="text-xs text-white/40 font-medium">📅 {formatEventDate(event.start)}</span>
                    <span className={`text-[9px] px-2.5 py-0.5 rounded-full border font-black uppercase tracking-wider ${tagStyle}`}>
                      {event.category}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => onEdit(event)} className="p-1.5 text-white/30 hover:text-white hover:bg-white/20 rounded-lg transition-colors" title="Edit event"><Pencil size={14} /></button>
                  <button onClick={() => onDelete(event.groupEventGroupId)} className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors" title="Delete event"><Trash2 size={14} /></button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="lunar-value text-center py-8">No events yet. Create one using the button above!</p>
      )}
    </div>
  );
}