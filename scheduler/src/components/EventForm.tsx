// scheduler/src/components/EventForm.tsx
'use client';

import { addEventAction } from "lib/actions";

interface EventFormProps {
  defaultDate: string;
  onSuccess: () => void;
}

export default function EventForm({ defaultDate, onSuccess }: EventFormProps) {
  
  // This handles the bridge between client and server
  async function handleFormAction(formData: FormData) {
    const result = await addEventAction(formData);
    
    // Close modal if successful
    if (result.success) {
      onSuccess();
    } else {
      alert(result.error);
    }
  }

  return (
    <form action={handleFormAction} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-semibold mb-1">Title</label>
        <input 
          name="title" 
          placeholder="e.g., SEG Meeting" 
          required 
          className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none" 
        />
      </div>
      
      <div>
        <label className="block text-sm font-semibold mb-1">Description</label>
        <textarea 
          name="description" 
          placeholder="Optional details..." 
          className="border p-3 rounded-lg w-full h-24 focus:ring-2 focus:ring-blue-500 outline-none" 
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-500 uppercase">Start Time</label>
          <input 
            name="start" 
            type="datetime-local" 
            defaultValue={`${defaultDate}T09:00`} 
            required 
            className="border p-2 rounded-lg"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-500 uppercase">End Time</label>
          <input 
            name="end" 
            type="datetime-local" 
            defaultValue={`${defaultDate}T10:00`} 
            required 
            className="border p-2 rounded-lg"
          />
        </div>
      </div>

      <button 
        type="submit" 
        className="bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
      >
        Save Event
      </button>
    </form>
  );
}