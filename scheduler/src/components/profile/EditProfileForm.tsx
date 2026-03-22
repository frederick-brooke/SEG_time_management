'use client';

import { X } from "lucide-react";
import { useFormStatus } from "react-dom";
import { updateProfile } from "@/src/app/actions/profile";

/**
 * Submit button that handles pending state automatically.
 * @param {object} props - Component props.
 * @param {string} props.text - Default button text.
 * @param {string} props.loadingText - Text shown while submitting.
 * @return {JSX.Element} Submit button.
 */
function SubmitButton({ text, loadingText }: { text: string; loadingText: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`lunar-button-primary ${pending ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {pending ? loadingText : text}
    </button>
  );
}

/**
 * Renders the inline form to edit user profile details.
 * @param {object} props - Component props.
 * @param {any} props.profile - The user's current profile data.
 * @param {Function} props.onClose - Callback to close the form.
 * @return {JSX.Element} The profile editing form.
 */
export default function EditProfileForm({ profile, onClose }: { profile: any; onClose: () => void }) {
  return (
    <div className="lunar-card p-6 mt-2 animate-in fade-in slide-in-from-top-2">
      <div className="flex justify-between items-center mb-6">
        <h3 className="lunar-label">Edit Details</h3>
        <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>

      <form action={updateProfile} className="space-y-4" onSubmit={() => setTimeout(onClose, 500)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="fname" className="lunar-label">First Name</label>
            <input
              id="fname"
              name="fname"
              defaultValue={profile.fname || ""}
              className="lunar-input w-full p-2.5 rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="lname" className="lunar-label">Last Name</label>
            <input
              id="lname"
              name="lname"
              defaultValue={profile.lname || ""}
              className="lunar-input w-full p-2.5 rounded-xl"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="bio" className="lunar-label">Bio</label>
          <textarea
            id="bio"
            name="bio"
            defaultValue={profile.bio || ""}
            className="lunar-input w-full p-2.5 rounded-xl h-24 resize-none"
            placeholder="Tell us a bit about yourself..."
          />
        </div>

        <div className="flex justify-end pt-2">
          <SubmitButton text="Save Changes" loadingText="Saving..." />
        </div>
      </form>
    </div>
  );
}