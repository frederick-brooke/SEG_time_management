'use client';

import { X } from "lucide-react";
import { useFormStatus } from "react-dom";
import { updateProfile } from "@/src/app/actions/profile"; // Adjust path if needed

/**
 * Submit button for the profile form that handles pending state automatically.
 * @param {Object} props - Component props.
 * @param {string} props.text - The default text to display.
 * @param {string} props.loadingText - The text to display while submitting.
 * @return {JSX.Element} A standardized submit button.
 */
function SubmitButton({ text, loadingText }: { text: string; loadingText: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`bg-black text-white px-6 py-2 rounded-xl font-medium transition-colors shadow-sm ${
        pending ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-800"
      }`}
    >
      {pending ? loadingText : text}
    </button>
  );
}

/**
 * Renders the form to edit user profile details (Name and Bio).
 * * @param {Object} props - Component props.
 * @param {any} props.profile - The user's current profile data.
 * @param {Function} props.onClose - State setter function to close the editing view.
 * @return {JSX.Element} The profile editing form.
 */
export default function EditProfileForm({ profile, onClose }: { profile: any; onClose: () => void }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mt-2 animate-in fade-in slide-in-from-top-2">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-gray-900">Edit Details</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
      </div>
      
      <form action={updateProfile} className="space-y-4" onSubmit={() => setTimeout(onClose, 500)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            {/* 1. Add htmlFor and id to First Name */}
            <label htmlFor="fname" className="text-xs font-semibold text-gray-600">First Name</label>
            <input
              id="fname"
              name="fname"
              defaultValue={profile.fname || ""}
              className="w-full border border-gray-200 bg-gray-50 p-2.5 rounded-lg focus:ring-2 focus:ring-black focus:outline-none transition-all text-sm"
            />
          </div>
          <div className="space-y-1">
            {/* 2. Add htmlFor and id to Last Name */}
            <label htmlFor="lname" className="text-xs font-semibold text-gray-600">Last Name</label>
            <input
              id="lname"
              name="lname"
              defaultValue={profile.lname || ""}
              className="w-full border border-gray-200 bg-gray-50 p-2.5 rounded-lg focus:ring-2 focus:ring-black focus:outline-none transition-all text-sm"
            />
          </div>
        </div>

        <div className="space-y-1">
          {/* 3. Add htmlFor and id to Bio */}
          <label htmlFor="bio" className="text-xs font-semibold text-gray-600">Bio</label>
          <textarea
            id="bio"
            name="bio"
            defaultValue={profile.bio || ""}
            className="w-full border border-gray-200 bg-gray-50 p-2.5 rounded-lg h-24 focus:ring-2 focus:ring-black focus:outline-none transition-all resize-none text-sm"
            placeholder="Tell us a bit about yourself..."
          />
        </div>
      </form>
    </div>
  );
}